// Script para colapsar/expandir el sidebar (ejemplo)
document.getElementById('toggleSidebar').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('collapsed');
    document.getElementById('content').classList.toggle('collapsed');
    document.getElementById('footer').classList.toggle('collapsed');
});
