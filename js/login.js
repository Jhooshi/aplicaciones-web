// js/login.js

const formLogin = document.getElementById('form-login');

// Credenciales fijas para la simulación académica
const CREDENCIALES_VALIDAS = {
    email: "admin@agro.com",
    password: "12345"
};

formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email').value.trim();
    const passwordInput = document.getElementById('password').value;
    
    // Verificación de credenciales
    if (emailInput === CREDENCIALES_VALIDAS.email && passwordInput === CREDENCIALES_VALIDAS.password) {
        // Guardamos un identificador en sessionStorage (se borra al cerrar la pestaña)
        sessionStorage.setItem('usuario_autenticado', 'true');
        sessionStorage.setItem('correo_usuario', emailInput);
        
        // Redireccionar al Dashboard principal
        window.location.href = 'index.html';
    } else {
        alert('Credenciales incorrectas. Intenta con admin@agro.com y 12345');
    }
});