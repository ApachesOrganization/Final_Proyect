document.addEventListener("DOMContentLoaded", () => {
    const socialUser = localStorage.getItem("socialUser");
    if (socialUser) {
        const { fullName, email, photoURL } = JSON.parse(socialUser);

        document.getElementById("fullName").value = fullName || "";
        document.getElementById("email").value = email || "";
        document.getElementById("email").readOnly = true; 

        if (photoURL) {
            const photoPreview = document.getElementById("photoPreview");
            photoPreview.src = photoURL;
            photoPreview.style.display = "block"; 
        }

        document.getElementById("passwordContainer").style.display = "none";
    } else {
        document.getElementById("passwordContainer").style.display = "block";
    }
});

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(async (result) => {
            const user = result.user;
            const userRef = firebase.firestore().collection("users").doc(user.uid);

            try {
                const doc = await userRef.get();

                if (doc.exists) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Bienvenido',
                        text: 'Inicio de sesión exitoso. Redirigiendo al inicio...',
                    }).then(() => {
                        window.location.href = "index.html";
                    });
                } else {
                    const socialUser = {
                        fullName: user.displayName || "",
                        email: user.email || "",
                        photoURL: user.photoURL || "default_profile.png",
                    };

                    localStorage.setItem("socialUser", JSON.stringify(socialUser));

                    Swal.fire({
                        icon: 'info',
                        title: 'Completa tu registro',
                        text: 'No encontramos una cuenta asociada a tu correo. Completa tu registro.',
                    }).then(() => {
                        window.location.href = "register.html"; 
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al verificar usuario',
                    text: error.message,
                });
            }
        })
        .catch((error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error al iniciar sesión con Google',
                text: error.message,
            });
        });
}

function registerUser() {
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const photoFile = document.getElementById("photo").files[0];
    const socialUser = localStorage.getItem("socialUser");

    if (!fullName || !email || (!socialUser && !password)) {
        Swal.fire({
            icon: 'error',
            title: 'Campos incompletos',
            text: 'Por favor, completa todos los campos obligatorios.',
        });
        return;
    }

    const registerUserInFirestore = (user, photoURL) => {
        firebase.firestore().collection("users").doc(user.uid).set({
            fullName,
            email,
            photoURL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        }).then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Registro exitoso',
                text: 'Usuario registrado con éxito. Redirigiendo al inicio...',
            }).then(() => {
                localStorage.removeItem("socialUser");
                window.location.href = "index.html";
            });
        }).catch((error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar datos',
                text: error.message,
            });
        });
    };

    if (socialUser) {
        const user = firebase.auth().currentUser;
        if (photoFile) {
            const storageRef = firebase.storage().ref(`users/${user.uid}/profile.jpg`);
            storageRef.put(photoFile).then(snapshot => snapshot.ref.getDownloadURL())
                .then(photoURL => registerUserInFirestore(user, photoURL))
                .catch(error => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error al subir foto',
                        text: error.message,
                    });
                });
        } else {
            const socialPhotoURL = JSON.parse(socialUser).photoURL || "default_profile.png";
            registerUserInFirestore(user, socialPhotoURL);
        }
    } else {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;

                if (photoFile) {
                    const storageRef = firebase.storage().ref(`users/${user.uid}/profile.jpg`);
                    storageRef.put(photoFile).then(snapshot => snapshot.ref.getDownloadURL())
                        .then(photoURL => registerUserInFirestore(user, photoURL))
                        .catch(error => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al subir foto',
                                text: error.message,
                            });
                        });
                } else {
                    registerUserInFirestore(user, "default_profile.png");
                }
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error en el registro',
                    text: error.message,
                });
            });
    }
}
