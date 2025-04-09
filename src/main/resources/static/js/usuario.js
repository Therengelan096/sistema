document.addEventListener('DOMContentLoaded', function () {
    fetch('/usuarios/actual') // Endpoint creado en UsuarioController
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo obtener la información del usuario');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('user-name').textContent = `${data.nombre} ${data.apellido}`;
        })
        .catch(error => {
            console.error('Error:', error);
        });
});