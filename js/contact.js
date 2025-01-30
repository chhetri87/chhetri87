document.addEventListener('DOMContentLoaded', function() {
    const storageManager = new StorageManager();
    
    // Track visitor
    storageManager.incrementVisitors();

    // Handle likes
    const likeButton = document.querySelector('.like-button');
    if (likeButton) {
        likeButton.addEventListener('click', function() {
            storageManager.incrementLikes();
            const likesCount = document.querySelector('.likes-count');
            if (likesCount) {
                likesCount.textContent = storageManager.getStats().likes;
            }
            likeButton.disabled = true;
            likeButton.classList.add('liked');
        });
    }

    // Handle contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const message = {
                name: this.querySelector('[name="name"]').value,
                email: this.querySelector('[name="email"]').value,
                subject: this.querySelector('[name="subject"]').value,
                message: this.querySelector('[name="message"]').value
            };

            storageManager.addMessage(message);
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Message sent successfully!';
            contactForm.appendChild(successMessage);
            
            // Reset form
            contactForm.reset();
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        });
    }
});
