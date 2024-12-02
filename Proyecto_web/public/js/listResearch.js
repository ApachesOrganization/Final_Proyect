const db = firebase.firestore();
const researchListDiv = document.getElementById("researchList");

function loadResearchList() {
    const filterTopic = document.getElementById("filterTopic").value.trim().toLowerCase();
    const filterDegree = document.getElementById("filterDegree").value.trim().toLowerCase();

    let query = db.collection("researchWorks");

    if (filterTopic && filterDegree) {
        query = query.where("areaLowerCase", "==", filterTopic).where("academicDegreeLowerCase", "==", filterDegree);
    } else if (filterTopic) {
        query = query.where("areaLowerCase", "==", filterTopic);
    } else if (filterDegree) {
        query = query.where("academicDegreeLowerCase", "==", filterDegree);
    }

    query.orderBy("createdAt", "desc").get()
        .then(snapshot => {
            researchListDiv.innerHTML = ""; 
            if (snapshot.empty) {
                researchListDiv.innerHTML = "<p>No se encontraron investigaciones con los filtros aplicados.</p>";
                return;
            }
            snapshot.forEach(doc => {
                const research = doc.data();
                const authorPhotoURL = research.authorPhotoURL || 'default_profile.png';
                const authorName = research.authorName || 'Autor desconocido';

                db.collection("researchWorks").doc(doc.id).collection("comments").get()
                    .then(commentsSnapshot => {
                        let totalRating = 0;
                        let ratingsCount = 0;

                        commentsSnapshot.forEach(commentDoc => {
                            const commentData = commentDoc.data();
                            totalRating += commentData.rating;
                            ratingsCount++;
                        });

                        let averageRating = ratingsCount > 0 ? (totalRating / ratingsCount).toFixed(1) : "Sin valoraciones";

                        const researchCard = `
                            <div class="research-card">
                                <img src="${authorPhotoURL}" alt="Imagen del autor" class="research-card-img">
                                <h3>${research.title}</h3>
                                <p>${research.description.substring(0, 100)}...</p>
                                <p><strong>Área:</strong> ${research.area}</p>
                                <p><strong>Grado Académico:</strong> ${research.academicDegree}</p>
                                <p><strong>Autor:</strong> ${authorName}</p>
                                <p><strong>Valoración:</strong> ${averageRating} / 5</p>
                                <a href="researchDetails.html?id=${doc.id}" class="btn">Ver detalles</a>
                            </div>
                        `;
                        researchListDiv.insertAdjacentHTML('beforeend', researchCard);
                    })
                    .catch(error => console.error("Error al obtener comentarios:", error));
            });
        })
        .catch(error => {
            console.error("Error al cargar investigaciones:", error);
            if (error.code === 'failed-precondition') {
                alert("Error: Es posible que necesites crear un índice en Firestore para usar estos filtros.");
            }
        });
}

function clearFilters() {
    document.getElementById("filterTopic").value = '';
    document.getElementById("filterDegree").value = '';
    loadResearchList();
}

document.addEventListener("DOMContentLoaded", loadResearchList);
