import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
from torchvision import transforms
from PIL import Image

# ============================================================
# 1. MODEL ARCHITECTURE
# ============================================================
class HybridFusionNet(nn.Module):
    def __init__(self, num_classes=11, proj_dim=256, use_attention=True):
        super(HybridFusionNet, self).__init__()
        self.use_attention = use_attention

        # Backbone models (no pretrained because weights will load)
        self.effnet = timm.create_model("efficientnet_b4", pretrained=False, features_only=True)
        self.densenet = timm.create_model("densenet201", pretrained=False, features_only=True)
        self.resnet = timm.create_model("resnet50", pretrained=False, features_only=True)

        eff_dims = [b["num_chs"] for b in self.effnet.feature_info]
        den_dims = [b["num_chs"] for b in self.densenet.feature_info]
        res_dims = [b["num_chs"] for b in self.resnet.feature_info]

        self.eff_idx = [1, 3, 4]
        self.den_idx = [1, 3, 4]
        self.res_idx = [1, 2, 4]

        self.proj = nn.ModuleList([
            nn.Conv2d(eff_dims[self.eff_idx[0]], proj_dim, kernel_size=1),
            nn.Conv2d(eff_dims[self.eff_idx[1]], proj_dim, kernel_size=1),
            nn.Conv2d(eff_dims[self.eff_idx[2]], proj_dim, kernel_size=1),

            nn.Conv2d(den_dims[self.den_idx[0]], proj_dim, kernel_size=1),
            nn.Conv2d(den_dims[self.den_idx[1]], proj_dim, kernel_size=1),
            nn.Conv2d(den_dims[self.den_idx[2]], proj_dim, kernel_size=1),

            nn.Conv2d(res_dims[self.res_idx[0]], proj_dim, kernel_size=1),
            nn.Conv2d(res_dims[self.res_idx[1]], proj_dim, kernel_size=1),
            nn.Conv2d(res_dims[self.res_idx[2]], proj_dim, kernel_size=1),
        ])

        fusion_dim = proj_dim * 9

        if use_attention:
            self.attn = nn.Sequential(
                nn.Linear(fusion_dim, fusion_dim // 2),
                nn.ReLU(),
                nn.Linear(fusion_dim // 2, fusion_dim),
                nn.Sigmoid()
            )

        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, 1024),
            nn.BatchNorm1d(1024),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(1024, num_classes)
        )

    def forward(self, x):
        eff_feats = self.effnet(x)
        den_feats = self.densenet(x)
        res_feats = self.resnet(x)

        selected = [
            eff_feats[self.eff_idx[0]], eff_feats[self.eff_idx[1]], eff_feats[self.eff_idx[2]],
            den_feats[self.den_idx[0]], den_feats[self.den_idx[1]], den_feats[self.den_idx[2]],
            res_feats[self.res_idx[0]], res_feats[self.res_idx[1]], res_feats[self.res_idx[2]],
        ]

        proj_outs = []
        for i, feat in enumerate(selected):
            f = self.proj[i](feat)
            f = F.adaptive_avg_pool2d(f, (1, 1)).flatten(1)
            proj_outs.append(f)

        fused = torch.cat(proj_outs, dim=1)

        if self.use_attention:
            fused = fused * self.attn(fused)

        return self.classifier(fused)


# ============================================================
# 2. PREPROCESS FUNCTION  (CRITICAL)
# ============================================================
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def preprocess_image(img):
    img = transform(img)
    img = img.unsqueeze(0)  # add batch dimension
    return img


# ============================================================
# 3. MODEL LOADING FUNCTION (FIXED)
# ============================================================
def load_model(weights_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = HybridFusionNet(num_classes=11)
    model.load_state_dict(torch.load(weights_path, map_location=device))

    model.to(device)
    model.eval()

    return model
