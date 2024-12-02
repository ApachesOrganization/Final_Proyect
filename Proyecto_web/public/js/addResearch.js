let imagesArray = []; // Arreglo para almacenar las imágenes seleccionadas

function addImage() {
    if (imagesArray.length >= 6) {
        Swal.fire({
            icon: 'error',
            title: 'Límite alcanzado',
            text: 'Has alcanzado el máximo de 6 imágenes.',
        });
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            imagesArray.push(file);
            updateImageContainer();
        }
    };

    input.click();
}

function updateImageContainer() {
    const imageContainer = document.getElementById('imageContainer');
    imageContainer.innerHTML = '';

    imagesArray.forEach((image, index) => {
        const reader = new FileReader();
        reader.onload = e => {
            const imgDiv = document.createElement('div');
            imgDiv.classList.add('position-relative', 'm-2');

            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100px';
            img.style.height = '100px';
            img.classList.add('img-thumbnail');
            img.style.cursor = 'pointer';

            img.onclick = () => {
                if (img.style.width === '100px') {
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                } else {
                    img.style.width = '100px';
                    img.style.height = '100px';
                }
            };

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.classList.add('btn', 'btn-danger', 'btn-sm', 'position-absolute', 'top-0', 'end-0');
            removeBtn.onclick = () => {
                imagesArray.splice(index, 1);
                updateImageContainer();
            };

            imgDiv.appendChild(img);
            imgDiv.appendChild(removeBtn);
            imageContainer.appendChild(imgDiv);
        };
        reader.readAsDataURL(image);
    });

    const imageCount = document.getElementById('imageCount');
    imageCount.textContent = `${imagesArray.length} imágenes agregadas`;
}

function addResearch() {
    const title = document.getElementById("title").value.trim();
    const area = document.getElementById("area").value.trim();
    const academicDegree = document.getElementById("academicDegree").value.trim();
    const description = document.getElementById("description").value.trim();
    const conclusions = document.getElementById("conclusions").value.trim();
    const recommendations = document.getElementById("recommendations").value.trim();
    const pdfFile = document.getElementById("pdfFile").files[0];

    if (!title || !area || !academicDegree || !description || !conclusions || !recommendations || !pdfFile || imagesArray.length < 4 || imagesArray.length > 6) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor, completa todos los campos y selecciona entre 4 y 6 imágenes.',
        });
        return;
    }

    if (description.length > 500 || conclusions.length > 500 || recommendations.length > 500) {
        Swal.fire({
            icon: 'error',
            title: 'Límite de caracteres',
            text: 'La descripción, conclusiones y recomendaciones no deben exceder los 500 caracteres.',
        });
        return;
    }

    const user = firebase.auth().currentUser;
    if (!user) {
        Swal.fire({
            icon: 'error',
            title: 'Inicia sesión',
            text: 'Debes iniciar sesión con una cuenta para agregar investigaciones.',
            confirmButtonText: 'Ir a iniciar sesión',
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }

    Swal.fire({
        title: 'Registrando investigación...',
        text: 'Por favor espera.',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        },
    });

    firebase.firestore().collection("users").doc(user.uid).get()
        .then(userDoc => {
            if (userDoc.exists) {
                const userData = userDoc.data();
                const fullName = userData.fullName || "Usuario Anónimo";
                const profilePhotoURL = userData.photoURL || "default_profile.png";

                const researchDocRef = firebase.firestore().collection("researchWorks").doc();

                const pdfStorageRef = firebase.storage().ref(`researchWorks/${researchDocRef.id}/main.pdf`);
                pdfStorageRef.put(pdfFile)
                    .then(snapshot => snapshot.ref.getDownloadURL())
                    .then(pdfURL => {
                        const imageUploadPromises = imagesArray.map((image, index) => {
                            const imageStorageRef = firebase.storage().ref(`researchWorks/${researchDocRef.id}/image_${index}`);
                            return imageStorageRef.put(image).then(snapshot => snapshot.ref.getDownloadURL());
                        });

                        return Promise.all(imageUploadPromises).then(imageURLs => {
                            return researchDocRef.set({
                                title,
                                area,
                                areaLowerCase: area.toLowerCase(),
                                academicDegree,
                                academicDegreeLowerCase: academicDegree.toLowerCase(),
                                description,
                                conclusions,
                                recommendations,
                                pdfURL,
                                imageURLs,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                createdBy: user.uid,
                                authorName: fullName,
                                authorPhotoURL: profilePhotoURL,
                            });
                        });
                    })
                    .then(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Investigación registrada',
                            text: 'La investigación se registró con éxito.',
                            confirmButtonText: 'Aceptar',
                        }).then(() => {
                            window.location.href = "index.html";
                        });
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al registrar investigación',
                            text: `Error: ${error.message}`,
                        });
                    });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar usuario',
                    text: 'No se encontró información del usuario en la base de datos.',
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error al obtener usuario',
                text: `Error: ${error.message}`,
            });
        });
}
