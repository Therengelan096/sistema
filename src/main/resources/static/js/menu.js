// menu.js
document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const logoutBtn = document.querySelector('.logout-btn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      sidebar.classList.toggle('collapsed');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = '/login.html';
    });
  }
});