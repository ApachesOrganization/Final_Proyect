function viewResearch(researchId) {
    const db = firebase.firestore();
    db.collection("researchWorks").doc(researchId).get()
        .then(doc => {
            if (doc.exists) {
                const research = doc.data();
                document.getElementById("researchTitle").innerText = research.title;
                document.getElementById("researchArea").innerText = `Área: ${research.area}`;
                document.getElementById("researchDescription").innerText = research.description;
                document.getElementById("researchConclusions").innerText = research.conclusions;
                document.getElementById("researchRecommendations").innerText = research.recommendations;

                document.getElementById("researchPDF").setAttribute("href", research.pdfURL);
                const imageContainer = document.getElementById("researchImages");
                research.images.forEach(url => {
                    const img = document.createElement("img");
                    img.src = url;
                    img.classList.add("img-thumbnail", "m-2");
                    img.style.width = "150px";
                    imageContainer.appendChild(img);
                });
            }
        })
        .catch(error => console.error("Error al cargar detalles de investigación:", error));
}
