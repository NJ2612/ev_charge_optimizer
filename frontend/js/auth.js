class AuthService {
    constructor() {
        this.user = JSON.parse(localStorage.getItem('user'));
        this.updateUI();
    }

    isAuthenticated() {
        return !!this.user;
    }

    async login(email, password) {
        // In a real application, this would make an API call to authenticate
        // For demo purposes, we'll simulate a successful login
        this.user = {
            email,
            name: email.split('@')[0],
        };
        localStorage.setItem('user', JSON.stringify(this.user));
        this.updateUI();
    }

    logout() {
        this.user = null;
        localStorage.removeItem('user');
        this.updateUI();
        window.location.href = '/login.html';
    }

    updateUI() {
        const navbarMenu = document.querySelector('.navbar-menu');
        if (!navbarMenu) return;

        if (this.isAuthenticated()) {
            document.getElementById('userName').textContent = this.user.name;
            document.getElementById('userEmail').textContent = this.user.email;
        }
    }
}

const authService = new AuthService(); 