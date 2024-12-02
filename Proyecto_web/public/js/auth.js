// Función para registrar un usuario manualmente
function registerUser(email, password, fullName, photoURL = "default_profile.png") {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;

            user.updateProfile({
                displayName: fullName,
                photoURL: photoURL
            }).then(() => {
                db.collection("users").doc(user.uid).set({
                    email: user.email,
                    fullName: fullName,
                    photoURL: photoURL,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    alert("Registro exitoso. Por favor inicia sesión.");
                    window.location.href = "login.html";
                });
            }).catch(error => {
                console.error("Error al actualizar el perfil:", error);
            });
        })
        .catch(error => {
            console.error("Error al registrar usuario:", error);
            alert(`Error: ${error.message}`);
        });
}
