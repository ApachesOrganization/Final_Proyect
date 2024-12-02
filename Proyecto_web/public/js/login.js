function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        Swal.fire({
            icon: 'error',
            title: 'Campos incompletos',
            text: 'Por favor, ingresa tu correo y contraseña.',
        });
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión exitoso',
                text: 'Redirigiendo al inicio...',
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = "index.html";
            });
        })
        .catch((error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error al iniciar sesión',
                text: error.message,
            });
        });
}

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

function loginAsGuest() {
    firebase.auth().signInAnonymously()
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Modo invitado',
                text: 'Redirigiendo al inicio...',
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = "index.html";
            });
        })
        .catch((error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error al iniciar como invitado',
                text: error.message,
            });
        });
}


function loginWithGitHub() {
    const provider = new firebase.auth.GithubAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión con GitHub',
                text: 'Redirigiendo al inicio...',
                timer: 1500,
                showConfirmButton: false,
            }).then(() => {
                window.location.href = "index.html";
            });
        })
        .catch((error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error al iniciar con GitHub',
                text: error.message,
            });
        });
}
