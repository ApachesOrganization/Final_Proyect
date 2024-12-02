const db = firebase.firestore();

const urlParams = new URLSearchParams(window.location.search);
const researchId = urlParams.get("id");

if (!researchId) {
    alert("No se encontró la investigación.");
    window.location.href = "index.html";
}

let currentUser;
let researchAuthorId;

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Usuario autenticado:", user.uid);
        loadResearchDetails();
    } else {
        console.log("Usuario no autenticado, acceso como invitado.");
        loadResearchDetails();
    }
});

function loadResearchDetails() {
    console.log("Intentando cargar investigación con ID:", researchId);

    db.collection("researchWorks").doc(researchId).get()
        .then(doc => {
            if (doc.exists) {
                console.log("Investigación encontrada:", doc.data());
                const research = doc.data();
                researchAuthorId = research.createdBy;

                document.getElementById("researchTitle").innerText = research.title;
                document.getElementById("researchArea").innerText = `Área: ${research.area}`;
                document.getElementById("researchAcademicDegree").innerText = `Grado Académico: ${research.academicDegree}`;
                document.getElementById("researchDescription").innerText = research.description;
                document.getElementById("researchConclusions").innerText = research.conclusions;
                document.getElementById("researchRecommendations").innerText = research.recommendations;

                const pdfLink = document.getElementById("researchPDF");
                pdfLink.href = research.pdfURL;

                document.getElementById("authorPhoto").src = research.authorPhotoURL || 'https://via.placeholder.com/150';
                document.getElementById("authorName").innerText = research.authorName || 'Autor desconocido';

                const imagesContainer = document.getElementById("researchImages");
                imagesContainer.innerHTML = "";
                research.imageURLs.forEach(url => {
                    const imgDiv = document.createElement('div');
                    imgDiv.classList.add('position-relative', 'm-2');

                    const img = document.createElement("img");
                    img.src = url;
                    img.classList.add("img-thumbnail");
                    img.style.width = "200px";
                    img.style.cursor = "pointer";

                    img.onclick = () => {
                        if (img.style.width === "200px") {
                            img.style.width = "auto";
                            img.style.height = "auto";
                        } else {
                            img.style.width = "200px";
                            img.style.height = "auto";
                        }
                    };

                    imgDiv.appendChild(img);
                    imagesContainer.appendChild(imgDiv);
                });

                loadComments();
            } else {
                console.error("No se encontró la investigación con ID:", researchId);
                alert("No se encontró la investigación.");
                window.location.href = "index.html";
            }
        })
        .catch(error => console.error("Error al cargar los detalles de la investigación:", error));
}

function loadComments() {
    const commentsList = document.getElementById("commentsList");

    db.collection("researchWorks").doc(researchId).collection("comments").orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            commentsList.innerHTML = ""; 
            let totalRating = 0;
            let ratingsCount = 0;

            snapshot.forEach(doc => {
                const commentData = doc.data();
                totalRating += commentData.rating;
                ratingsCount++;

                const commentDiv = document.createElement("div");
                commentDiv.classList.add("card", "mb-3");

                db.collection("users").doc(commentData.userId).get()
                    .then(userDoc => {
                        let userName = "Invitado";
                        let userPhoto = "https://via.placeholder.com/40"; 
                        let isAuthor = commentData.userId === researchAuthorId;

                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userName = userData.fullName || "Invitado";
                            userPhoto = userData.photoURL || "https://via.placeholder.com/40";
                        }

                        const starsContainer = document.createElement("div");
                        starsContainer.classList.add("rating-stars");
                        for (let i = 1; i <= 5; i++) {
                            const star = document.createElement("span");
                            star.textContent = "★";
                            star.classList.add(i <= commentData.rating ? "filled" : "dim");
                            starsContainer.appendChild(star);
                        }

                        const authorBadge = isAuthor ? `<span class="badge bg-info ms-2">Autor</span>` : "";

                        commentDiv.innerHTML = `
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-2">
                                    <img src="${userPhoto}" alt="${userName}" class="rounded-circle me-2 comment-photo">
                                    <h5 class="card-title mb-0">${userName} ${authorBadge}</h5>
                                </div>
                            </div>
                        `;
                        commentDiv.querySelector(".card-body").appendChild(starsContainer);
                        commentDiv.innerHTML += `
                            <p class="card-text">${commentData.comment}</p>
                            <p class="card-text"><small class="text-muted">${commentData.createdAt ? new Date(commentData.createdAt.toDate()).toLocaleString() : ''}</small></p>
                            <div class="replies-container"></div>
                            <button class="btn btn-link reply-btn" data-comment-id="${doc.id}">Responder</button>
                        `;

                        commentsList.appendChild(commentDiv);

                        loadReplies(doc.id, commentDiv.querySelector(".replies-container"));
                    })
                    .catch(error => console.error("Error al obtener datos del usuario:", error));
            });

            const averageRatingDiv = document.getElementById("averageRating");
            if (ratingsCount > 0) {
                const averageRating = (totalRating / ratingsCount).toFixed(1);
                averageRatingDiv.innerHTML = `<strong>Valoración promedio:</strong> ${averageRating} / 5`;
            } else {
                averageRatingDiv.innerHTML = "Sin valoraciones aún.";
            }
        }, error => console.error("Error al cargar comentarios:", error));
}

function loadReplies(commentId, container) {
    db.collection("researchWorks").doc(researchId).collection("comments").doc(commentId).collection("replies")
        .orderBy("createdAt", "desc")
        .get()
        .then(snapshot => {
            container.innerHTML = ""; 

            snapshot.forEach(doc => {
                const replyData = doc.data();

                const replyDiv = document.createElement("div");
                replyDiv.classList.add("reply-card");

                db.collection("users").doc(replyData.userId).get()
                    .then(userDoc => {
                        let userName = "Invitado";
                        let userPhoto = "https://via.placeholder.com/40"; 
                        let isAuthor = replyData.userId === researchAuthorId; 

                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userName = userData.fullName || "Invitado";
                            userPhoto = userData.photoURL || "https://via.placeholder.com/40";
                        }

                        const authorBadge = isAuthor ? `<span class="badge bg-info ms-2">Autor</span>` : "";

                        replyDiv.innerHTML = `
                            <div class="reply-header d-flex align-items-center mb-2">
                                <img src="${userPhoto}" alt="${userName}" class="rounded-circle reply-photo me-2">
                                <h6 class="mb-0">${userName} ${authorBadge}</h6>
                            </div>
                            <p class="reply-text">${replyData.replyText}</p>
                            <p class="reply-date text-muted"><small>${replyData.createdAt ? new Date(replyData.createdAt.toDate()).toLocaleString() : ''}</small></p>
                        `;
                        container.appendChild(replyDiv);
                    })
                    .catch(error => console.error("Error al obtener datos del usuario:", error));
            });
        })
        .catch(error => console.error("Error al cargar respuestas:", error));
}

document.addEventListener("click", (event) => {
    if (event.target.classList.contains("reply-btn")) {
        const commentId = event.target.dataset.commentId;

        const existingReplyForm = document.querySelector(".reply-form");
        if (existingReplyForm) {
            existingReplyForm.remove();
        }

        const replyForm = document.createElement("form");
        replyForm.classList.add("reply-form");
        replyForm.innerHTML = `
            <textarea class="form-control mb-2 reply-input" placeholder="Escribe tu respuesta..."></textarea>
            <div class="d-flex justify-content-end">
                <button type="submit" class="btn btn-sm btn-primary me-2">Responder</button>
                <button type="button" class="btn btn-sm btn-secondary cancel-reply-btn">Cancelar</button>
            </div>
        `;

        event.target.after(replyForm);

        replyForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const replyText = replyForm.querySelector("textarea").value.trim();
            if (!replyText) {
                alert("La respuesta no puede estar vacía.");
                return;
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                alert("Debes estar autenticado para responder.");
                return;
            }

            db.collection("researchWorks").doc(researchId).collection("comments").doc(commentId).collection("replies")
                .add({
                    userId: user.uid,
                    replyText: replyText,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    alert("Respuesta agregada correctamente.");
                    replyForm.remove();
                })
                .catch(error => console.error("Error al agregar respuesta:", error));
        });

        replyForm.querySelector(".cancel-reply-btn").addEventListener("click", () => {
            replyForm.remove();
        });
    }
});


function submitComment(event) {
    event.preventDefault();

    const rating = parseInt(document.querySelector('input[name="rating"]:checked')?.value);
    const commentText = document.getElementById("commentText").value.trim();

    if (!rating || !commentText) {
        alert("Por favor, completa todos los campos del comentario.");
        return;
    }

    if (commentText.length > 500) {
        alert("El comentario no debe exceder los 500 caracteres.");
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        alert("Debes estar autenticado para comentar.");
        return;
    }

    const commentData = {
        userId: user.uid,
        rating: rating,
        comment: commentText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("researchWorks").doc(researchId).collection("comments")
        .add(commentData)
        .then(() => {
            alert("Comentario agregado exitosamente.");
            document.getElementById("commentForm").reset();
            document.getElementById("commentCount").textContent = "0 / 500 palabras";
        })
        .catch(error => {
            console.error("Error al agregar el comentario:", error);
            alert("Error al agregar el comentario: " + error.message);
        });
}

document.getElementById("commentForm").addEventListener("submit", submitComment);

document.addEventListener('DOMContentLoaded', () => {
    setupWordCounter('commentText', 'commentCount', 500);
});
