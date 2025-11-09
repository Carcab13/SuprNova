// 1. Initialize Supabase
// PASTE YOUR SUPABASE PROJECT URL AND ANON KEY HERE
const supabaseUrl = 'https://bdarbfivfvdkqmbunhmn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkYXJiZml2ZnZka3FtYnVuaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDc5OTcsImV4cCI6MjA3ODE4Mzk5N30.xuZbNs6NpqjcBl16kFOIjpgloXSfSazELaBFAH4-S00';

// Create a single Supabase client for interacting with your database.
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- Notification Logic ---
const notification = document.getElementById('notification');
let notificationTimeout; // To hold the timeout ID

function showNotification(message, type) {
    // Clear any existing timeout to prevent stacking/overlapping
    clearTimeout(notificationTimeout);

    notification.textContent = message;
    notification.className = `notification show ${type}`; // e.g., 'error' or 'success'

    notificationTimeout = setTimeout(() => {
        notification.className = 'notification';
    }, 3000);
}

// --- Load Wishlist Items from Supabase ---
async function loadWishlistItems() {
    const cardsContainer = document.getElementById('cards-container');
    const loadingMessage = document.getElementById('loading-message');

    try {
        // Fetch all wishlist items from Supabase
        const { data: items, error } = await _supabase
            .from('wishlist_items')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            throw error;
        }

        // Remove loading message
        if (loadingMessage) {
            loadingMessage.remove();
        }

        // Clear container
        cardsContainer.innerHTML = '';

        // If no items found
        if (!items || items.length === 0) {
            cardsContainer.innerHTML = '<div style="text-align: center; color: white; padding: 2rem;">No wishlist items found.</div>';
            return;
        }

        // Create cards for each item
        items.forEach(item => {
            const card = createWishlistCard(item);
            cardsContainer.appendChild(card);
        });

        // Initialize event listeners for the new cards
        initializeCardEventListeners();

    } catch (error) {
        console.error('Error loading wishlist items:', error);
        if (loadingMessage) {
            loadingMessage.textContent = 'Error loading wishlist items. Please try again later.';
            loadingMessage.style.color = '#e74c3c';
        }
    }
}

// --- Create Wishlist Card Element ---
function createWishlistCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-id', item.id);
    if (item.url) {
        card.setAttribute('data-url', item.url);
    }
    if (item.image_url) {
        card.setAttribute('data-image', item.image_url);
    }

    // Add image if available
    if (item.image_url) {
        const img = document.createElement('img');
        img.src = item.image_url;
        img.alt = item.title || 'Item image';
        img.className = 'card-image';
        img.onerror = function() {
            this.style.display = 'none';
        };
        card.appendChild(img);
    }

    // Create a content wrapper for text and buttons
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'card-content';

    // Add title
    const title = document.createElement('h1');
    title.textContent = item.title || 'Untitled Item';
    contentWrapper.appendChild(title);

    // Add description
    if (item.description) {
        const description = document.createElement('p');
        description.className = 'Description';
        description.textContent = item.description;
        contentWrapper.appendChild(description);
    }

    // Add horizontal rule if there's a price
    if (item.price) {
        const hr = document.createElement('hr');
        contentWrapper.appendChild(hr);

        // Add price
        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = item.price;
        contentWrapper.appendChild(price);
    }

    // Create a button wrapper
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'card-buttons';

    // Add Visit button
    if (item.url) {
        const visitBtn = document.createElement('button');
        visitBtn.className = 'btn visit-btn';
        visitBtn.textContent = 'Visit';
        buttonWrapper.appendChild(visitBtn);
    }

    // Add Reserve button
    const reserveBtn = document.createElement('button');
    reserveBtn.className = 'btn reserve-btn';
    reserveBtn.textContent = item.is_reserved ? 'Reserved' : 'Reserve';
    reserveBtn.disabled = item.is_reserved;
    buttonWrapper.appendChild(reserveBtn);

    contentWrapper.appendChild(buttonWrapper);

    card.appendChild(contentWrapper);

    return card;
}

// --- Initialize Event Listeners for Cards ---
function initializeCardEventListeners() {
    // Visit button listeners
    const visitButtons = document.querySelectorAll('.visit-btn');
    visitButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const card = event.target.closest('.card');
            const url = card.dataset.url;

            if (!url) {
                showNotification('No URL specified for this item.', 'error');
                return;
            }

            window.open(url, '_blank');
        });
    });

    // Reserve button listeners
    const reserveButtons = document.querySelectorAll('.reserve-btn');
    reserveButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const card = event.target.closest('.card');
            const itemId = card.dataset.id;

            if (!itemId) {
                console.error('Card is missing a data-id attribute!');
                return;
            }

            await reserveItem(itemId, button);
        });
    });
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Load wishlist items from Supabase
    loadWishlistItems();
});

async function reserveItem(itemId, button) {
    try {
        // Call the database function 'reserve_wishlist_item' we created in Supabase
        const { data, error } = await _supabase.rpc('reserve_wishlist_item', {
            item_id_to_reserve: itemId
        });

        if (error) {
            // If the RPC call itself fails
            throw new Error('An unexpected error occurred. Please try again.');
        }
        
        if (data === 'SUCCESS') {
            // If the function returns 'SUCCESS'
            showNotification('Item successfully reserved!', 'success');
            button.textContent = 'Reserved';
            button.disabled = true;
        } else if (data === 'ALREADY_RESERVED') {
            // If the function returns 'ALREADY_RESERVED'
            throw new Error('This item has already been reserved.');
        }
    } catch (error) {
        showNotification(error.message, 'error');
        console.error("Reservation failed: ", error.message);
    }
}