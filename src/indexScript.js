 // Mobile menu toggle
 const menuToggle = document.querySelector('.menu-toggle');
 const navLinks = document.querySelector('.nav-links');

 menuToggle.addEventListener('click', function() {
     menuToggle.classList.toggle('active');
     navLinks.classList.toggle('active');
 });

 // Close mobile menu when clicking on a link
 document.querySelectorAll('.nav-links a').forEach(link => {
     link.addEventListener('click', function() {
         menuToggle.classList.remove('active');
         navLinks.classList.remove('active');
     });
 });

 // Close mobile menu when clicking outside
 document.addEventListener('click', function(event) {
     const isClickInsideNav = event.target.closest('nav');
     if (!isClickInsideNav && navLinks.classList.contains('active')) {
         menuToggle.classList.remove('active');
         navLinks.classList.remove('active');
     }
 });

 // Smooth scrolling for navigation links
 document.querySelectorAll('a[href^="#"]').forEach(anchor => {
     anchor.addEventListener('click', function (e) {
         e.preventDefault();
         const target = document.querySelector(this.getAttribute('href'));
         if (target) {
             const offset = 70; // Account for fixed navbar
             const targetPosition = target.offsetTop - offset;
             window.scrollTo({
                 top: targetPosition,
                 behavior: 'smooth'
             });
         }
     });
 });

 // Discord webhook configuration
 // Replace with your Discord webhook URL
 const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1436861645044322525/y33KWVM67BfCE2ZGPOlZjBx_t8rWQVmhy4AWoNiishMRjmmPk21A4dz5cmG-wdWtj69g';

 // Function to send Discord webhook notification
 async function sendDiscordNotification(name, email, message) {
     if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_DISCORD_WEBHOOK_URL_HERE') {
         console.log('Discord webhook URL not configured');
         return;
     }

     try {
         const embed = {
             title: '📧 New Contact Form Submission',
             color: 0x667eea, // Purple color matching your theme
             fields: [
                 {
                     name: '👤 Name',
                     value: name || 'Not provided',
                     inline: true
                 },
                 {
                     name: '📧 Email',
                     value: email || 'Not provided',
                     inline: true
                 },
                 {
                     name: '💬 Message',
                     value: message || 'No message',
                     inline: false
                 }
             ],
             timestamp: new Date().toISOString(),
             footer: {
                 text: 'SuprNova Contact Form'
             }
         };

         await fetch(DISCORD_WEBHOOK_URL, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({
                 embeds: [embed]
             })
         });
     } catch (error) {
         console.error('Error sending Discord notification:', error);
         // Don't show error to user, just log it
     }
 }

 // Form submission handler for web3forms
 const form = document.getElementById('contact-form');
 const result = document.getElementById('form-result');
 const submitBtn = document.getElementById('submit-btn');

 form.addEventListener('submit', async function(e) {
     e.preventDefault();
     
     // Disable submit button
     submitBtn.disabled = true;
     submitBtn.textContent = 'Sending...';
     result.innerHTML = '';
     
     // Get form data
     const formData = new FormData(form);
     const name = formData.get('name');
     const email = formData.get('email');
     const message = formData.get('message');
     
     try {
         const response = await fetch('https://api.web3forms.com/submit', {
             method: 'POST',
             body: formData
         });
         
         const data = await response.json();
         
         if (data.success) {
             result.innerHTML = '<div class="success-message">✓ Thank you for your message! We will get back to you soon.</div>';
             form.reset();
             
             // Send Discord notification
             await sendDiscordNotification(name, email, message);
         } else {
             result.innerHTML = '<div class="error-message">✗ Something went wrong. Please try again later.</div>';
         }
     } catch (error) {
         result.innerHTML = '<div class="error-message">✗ Error sending message. Please try again later.</div>';
     } finally {
         // Re-enable submit button
         submitBtn.disabled = false;
         submitBtn.textContent = 'Send Message';
     }
 });

 // Handle window resize
 window.addEventListener('resize', function() {
     if (window.innerWidth > 768) {
         menuToggle.classList.remove('active');
         navLinks.classList.remove('active');
     }
 });