const navLogin = document.getElementById('navLogin');
const navRegister = document.getElementById('navRegister');
const navLogout = document.getElementById('navLogout');
const userPhoto = document.getElementById('userPhoto');
const profilePhoto = document.getElementById('profilePhoto'); 
const userNameField = document.getElementById('userNameField'); 

function salir() {
    firebase.auth().signOut()
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión correctamente.',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                window.location.href = "login.html";
            });
        })
        .catch(error => {
            console.error("Error al cerrar sesión:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cerrar sesión',
                text: `No se pudo cerrar la sesión: ${error.message}`,
            });
        });
}

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        navLogin.style.display = 'none';
        navRegister.style.display = 'none';
        navLogout.style.display = 'block';

        if (user.isAnonymous) {
            userPhoto.style.display = 'none';
            const guestLabel = document.createElement('span');
            guestLabel.id = 'guestLabel';
            guestLabel.classList.add('navbar-text', 'text-white', 'mx-2');
            guestLabel.textContent = 'Invitado';
            navLogout.parentNode.insertBefore(guestLabel, navLogout);

            if (userNameField) userNameField.value = 'Invitado';
            if (profilePhoto) profilePhoto.src = 'default_profile.png';
        } else {
            const uid = user.uid;
            firebase.firestore().collection('users').doc(uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.photoURL) {
                            userPhoto.src = userData.photoURL;
                            userPhoto.style.display = 'block';
                        }

                        if (userNameField) userNameField.value = userData.fullName || user.displayName || 'Usuario';
                        if (profilePhoto) profilePhoto.src = userData.photoURL || 'default_profile.png';
                    } else {
                        if (userNameField) userNameField.value = user.displayName || 'Usuario';
                        if (profilePhoto) profilePhoto.src = user.photoURL || 'default_profile.png';
                    }
                })
                .catch(error => console.error('Error al obtener datos del usuario:', error));
        }
    } else {
        navLogin.style.display = 'block';
        navRegister.style.display = 'block';
        navLogout.style.display = 'none';
        userPhoto.style.display = 'none';

        if (userNameField) userNameField.value = '';
        if (profilePhoto) profilePhoto.src = 'default_profile.png';

        const guestLabel = document.getElementById('guestLabel');
        if (guestLabel) {
            guestLabel.remove();
        }
    }
});
