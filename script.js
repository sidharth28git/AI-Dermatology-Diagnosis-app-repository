document.getElementById("predictBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("imageUpload");
    if (!fileInput.files[0]) {
        alert("Please upload an image first.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);  

    document.getElementById("loader").classList.remove("hidden");
    document.getElementById("result").classList.add("hidden");

    try {
        const response = await fetch("http://127.0.0.1:8001/predict", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Backend error");

        const data = await response.json();

        document.getElementById("predClass").innerText = data.class_name;
        document.getElementById("predConf").innerText = (data.confidence * 100).toFixed(2) + "%";

        const imgPreview = document.getElementById("previewImg");
        imgPreview.src = URL.createObjectURL(fileInput.files[0]);
        imgPreview.classList.remove("hidden");

        document.getElementById("result").classList.remove("hidden");

    } catch (error) {
        alert("Prediction failed. Check backend logs.");
        console.error(error);
    }

    document.getElementById("loader").classList.add("hidden");
});
