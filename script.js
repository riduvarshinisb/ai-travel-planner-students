// Theme Management
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load saved theme or default to dark
const savedTheme = sessionStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    sessionStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Interest Tags Selection
const interestTags = document.querySelectorAll('.tag');
const interestsInput = document.getElementById('interests');
let selectedInterests = [];

interestTags.forEach(tag => {
    tag.addEventListener('click', (e) => {
        e.preventDefault();
        const interest = tag.dataset.interest;
        
        if (tag.classList.contains('active')) {
            tag.classList.remove('active');
            selectedInterests = selectedInterests.filter(i => i !== interest);
        } else {
            tag.classList.add('active');
            selectedInterests.push(interest);
        }
        
        interestsInput.value = selectedInterests.join(', ');
    });
});

// Form Submission
const travelForm = document.getElementById('travelForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');

let currentItinerary = null;

travelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        destination: document.getElementById('destination').value,
        duration: parseInt(document.getElementById('duration').value),
        budget: parseInt(document.getElementById('budget').value),
        interests: document.getElementById('interests').value || 'general sightseeing',
        travelStyle: document.getElementById('travelStyle').value,
        groupSize: parseInt(document.getElementById('groupSize').value)
    };
    
    // Show loading
    loadingOverlay.classList.add('active');
    resultsSection.style.display = 'none';
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate itinerary');
        }
        
        const itinerary = await response.json();
        currentItinerary = itinerary;
        
        // Hide loading
        loadingOverlay.classList.remove('active');
        
        // Display results
        displayResults(itinerary);
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.classList.remove('active');
        alert('Failed to generate itinerary. Please check your API key and try again.');
    }
});

// Display Results
function displayResults(itinerary) {
    resultsSection.style.display = 'block';
    
    let html = `
        <!-- Overview -->
        <div class="overview-card animate-in">
            <h2><i class="fas fa-location-dot"></i> ${itinerary.destination}</h2>
            <p>${itinerary.overview}</p>
        </div>
        
        <!-- Budget Breakdown -->
        <div class="budget-breakdown animate-in">
            <h3><i class="fas fa-chart-pie"></i> Budget Breakdown</h3>
            <div class="budget-items">
                ${generateBudgetItems(itinerary.budgetBreakdown)}
            </div>
            <div class="budget-total">
                <span>Total Budget</span>
                <span class="budget-total-amount">$${calculateTotal(itinerary.budgetBreakdown)}</span>
            </div>
        </div>
        
        <!-- Daily Itinerary -->
        <div class="daily-itinerary">
            <h2 class="section-title"><i class="fas fa-calendar-days"></i> Daily Itinerary</h2>
            ${generateDailyItinerary(itinerary.dailyItinerary)}
        </div>
        
        <!-- Info Grid -->
        <div class="info-grid">
            ${generateAccommodations(itinerary.accommodationSuggestions)}
            ${generateTransportation(itinerary.transportationTips)}
            ${generateDiscounts(itinerary.studentDiscounts)}
            ${generateInsights(itinerary.localStudentInsights)}
            ${generateSustainable(itinerary.sustainableOptions)}
            ${generateTips(itinerary.moneySavingTips, 'money')}
            ${generateTips(itinerary.safetyTips, 'safety')}
            ${generatePackingList(itinerary.packingList)}
        </div>
        
        <!-- Weather & Emergency -->
        <div class="info-grid">
            ${generateWeather(itinerary.weatherConsiderations)}
            ${generateEmergency(itinerary.emergencyInfo)}
        </div>
    `;
    
    resultsContent.innerHTML = html;
}

function generateBudgetItems(breakdown) {
    const icons = {
        accommodation: 'fa-bed',
        food: 'fa-utensils',
        transportation: 'fa-bus',
        activities: 'fa-ticket',
        miscellaneous: 'fa-bag-shopping'
    };
    
    return Object.entries(breakdown).map(([key, value]) => `
        <div class="budget-item">
            <div class="budget-item-label">
                <i class="fas ${icons[key]}"></i>
                <span>${capitalize(key)}</span>
            </div>
            <div class="budget-item-amount">$${value}</div>
        </div>
    `).join('');
}

function calculateTotal(breakdown) {
    return Object.values(breakdown).reduce((sum, val) => sum + val, 0);
}

function generateDailyItinerary(days) {
    return days.map(day => `
        <div class="day-card animate-in">
            <div class="day-header">
                <div class="day-title">
                    <div class="day-number">Day ${day.day}</div>
                    <h3>${day.title}</h3>
                </div>
                <div class="day-cost">
                    <i class="fas fa-coins"></i>
                    $${day.estimatedDailyCost}
                </div>
            </div>
            
            <div class="activities">
                ${day.activities.map(activity => `
                    <div class="activity">
                        <div class="activity-header">
                            <div class="activity-time">
                                <i class="fas fa-clock"></i>
                                ${activity.time}
                            </div>
                            <div class="activity-cost">$${activity.cost}</div>
                        </div>
                        <h4 class="activity-title">${activity.activity}</h4>
                        <div class="activity-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${activity.location} • ${activity.duration}
                        </div>
                        <p class="activity-description">${activity.description}</p>
                        ${activity.studentTip ? `
                            <div class="student-tip">
                                <div class="student-tip-label">
                                    <i class="fas fa-lightbulb"></i>
                                    Student Tip
                                </div>
                                <p>${activity.studentTip}</p>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div class="meals">
                <h4><i class="fas fa-utensils"></i> Meals</h4>
                <div class="meal-list">
                    <div class="meal-item">
                        <i class="fas fa-coffee"></i>
                        <strong>Breakfast:</strong> ${day.meals.breakfast}
                    </div>
                    <div class="meal-item">
                        <i class="fas fa-burger"></i>
                        <strong>Lunch:</strong> ${day.meals.lunch}
                    </div>
                    <div class="meal-item">
                        <i class="fas fa-pizza-slice"></i>
                        <strong>Dinner:</strong> ${day.meals.dinner}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function generateAccommodations(accommodations) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-hotel"></i> Accommodation Options</h3>
            <div class="accommodation-list">
                ${accommodations.map(acc => `
                    <div class="accommodation-item">
                        <div class="item-header">
                            <div>
                                <div class="item-title">${acc.name}</div>
                                <span style="color: var(--text-muted); font-size: 0.9rem;">${acc.type}</span>
                            </div>
                            <div class="item-price">$${acc.pricePerNight}/night</div>
                        </div>
                        <p style="margin: 0.75rem 0; line-height: 1.6;">${acc.description}</p>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">
                            <i class="fas fa-location-dot"></i> ${acc.location}
                        </div>
                        ${acc.studentDiscount !== 'No' ? `
                            <span class="item-badge">
                                <i class="fas fa-graduation-cap"></i> ${acc.studentDiscount}
                            </span>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateTransportation(tips) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-train"></i> Transportation</h3>
            <div class="transport-list">
                ${tips.map(tip => `
                    <div class="transport-item">
                        <div class="item-header">
                            <div class="item-title">${tip.type}</div>
                            <div class="item-price">~$${tip.estimatedCost}</div>
                        </div>
                        <p style="margin: 0.75rem 0; line-height: 1.6;">${tip.description}</p>
                        ${tip.studentDiscount ? `
                            <span class="item-badge">
                                <i class="fas fa-graduation-cap"></i> ${tip.studentDiscount}
                            </span>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateDiscounts(discounts) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-graduation-cap"></i> Student Discounts</h3>
            <div class="discount-list">
                ${discounts.map(discount => `
                    <div class="discount-item">
                        <div class="item-title">${discount.place}</div>
                        <div class="discount-compare">
                            <span class="price-normal">$${discount.normalPrice}</span>
                            <i class="fas fa-arrow-right" style="color: var(--text-muted);"></i>
                            <span class="price-student">$${discount.studentPrice}</span>
                        </div>
                        <p style="margin-top: 0.75rem; color: var(--text-muted); font-size: 0.9rem;">
                            <i class="fas fa-id-card"></i> ${discount.requirement}
                        </p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateInsights(insights) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-users"></i> Local Student Insights</h3>
            <div class="insight-list">
                ${insights.map(insight => `
                    <div class="insight-item">
                        <i class="fas fa-quote-left"></i>
                        <p>${insight}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateSustainable(options) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-leaf"></i> Sustainable Options</h3>
            <div class="sustainable-list">
                ${options.map(option => `
                    <div class="sustainable-item">
                        <div class="item-title">${option.category}</div>
                        <p style="margin: 0.75rem 0; line-height: 1.6;"><strong>${option.option}</strong></p>
                        <p style="color: var(--success-color); font-size: 0.9rem;">
                            <i class="fas fa-seedling"></i> ${option.impact}
                        </p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateTips(tips, type) {
    const icons = {
        money: { icon: 'fa-piggy-bank', title: 'Money Saving Tips', color: 'var(--success-color)' },
        safety: { icon: 'fa-shield-halved', title: 'Safety Tips', color: 'var(--warning-color)' }
    };
    
    const config = icons[type];
    
    return `
        <div class="info-card">
            <h3><i class="fas ${config.icon}"></i> ${config.title}</h3>
            <div class="tips-list">
                ${tips.map(tip => `
                    <div class="tip-item">
                        <i class="fas fa-check-circle" style="color: ${config.color};"></i>
                        <p>${tip}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generatePackingList(items) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-suitcase"></i> Packing List</h3>
            <div class="tips-list">
                ${items.map(item => `
                    <div class="tip-item">
                        <i class="fas fa-check" style="color: var(--primary-color);"></i>
                        <p>${item}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateWeather(weather) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-cloud-sun"></i> Weather Information</h3>
            <p style="line-height: 1.8;">${weather}</p>
        </div>
    `;
}

function generateEmergency(info) {
    return `
        <div class="info-card">
            <h3><i class="fas fa-circle-exclamation"></i> Emergency Information</h3>
            <div class="emergency-info">
                <div class="emergency-item">
                    <strong><i class="fas fa-phone"></i> Emergency Number</strong>
                    <p>${info.emergencyNumber}</p>
                </div>
                <div class="emergency-item">
                    <strong><i class="fas fa-building-columns"></i> Embassy</strong>
                    <p>${info.embassy}</p>
                </div>
                <div class="emergency-item">
                    <strong><i class="fas fa-hospital"></i> Hospitals</strong>
                    <p>${info.hospitals}</p>
                </div>
            </div>
        </div>
    `;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Action Buttons
document.getElementById('saveBtn').addEventListener('click', () => {
    if (!currentItinerary) return;
    
    // Create a printable version
    window.print();
});

document.getElementById('shareBtn').addEventListener('click', async () => {
    if (!currentItinerary) return;
    
    const shareText = `Check out my ${currentItinerary.destination} travel itinerary created with Student Travel AI!`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: `${currentItinerary.destination} Travel Plan`,
                text: shareText,
                url: window.location.href
            });
        } catch (err) {
            console.log('Share cancelled');
        }
    } else {
        // Fallback: copy to clipboard
        const url = window.location.href;
        navigator.clipboard.writeText(`${shareText}\n${url}`);
        
        // Show feedback
        const btn = document.getElementById('shareBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'var(--success-color)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--success-color)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }, 2000);
    }
});

document.getElementById('newPlanBtn').addEventListener('click', () => {
    // Scroll to form
    document.querySelector('.planning-section').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Reset form
    travelForm.reset();
    selectedInterests = [];
    interestTags.forEach(tag => tag.classList.remove('active'));
    interestsInput.value = '';
});

// Smooth scroll for all internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements when they're added
const observeNewElements = () => {
    document.querySelectorAll('.animate-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
};

// Initial observation
observeNewElements();

// Re-observe when new content is added
const contentObserver = new MutationObserver(() => {
    observeNewElements();
});

contentObserver.observe(resultsContent, {
    childList: true,
    subtree: true
});

// Form validation with visual feedback
const inputs = document.querySelectorAll('input[required], select[required]');
inputs.forEach(input => {
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.style.borderColor = 'var(--warning-color)';
        } else {
            input.style.borderColor = 'var(--border-color)';
        }
    });
    
    input.addEventListener('input', () => {
        if (input.value) {
            input.style.borderColor = 'var(--success-color)';
        }
    });
});

// Budget calculator helper
const budgetInput = document.getElementById('budget');
const durationInput = document.getElementById('duration');

function updateBudgetHint() {
    const budget = parseFloat(budgetInput.value) || 0;
    const duration = parseInt(durationInput.value) || 1;
    
    if (budget && duration) {
        const dailyBudget = (budget / duration).toFixed(2);
        const hint = document.getElementById('budgetHint');
        
        if (!hint) {
            const hintElement = document.createElement('small');
            hintElement.id = 'budgetHint';
            hintElement.style.color = 'var(--text-muted)';
            hintElement.style.marginTop = '0.5rem';
            hintElement.style.display = 'block';
            budgetInput.parentElement.appendChild(hintElement);
        }
        
        document.getElementById('budgetHint').textContent = 
            `≈ $${dailyBudget} per day`;
    }
}

budgetInput.addEventListener('input', updateBudgetHint);
durationInput.addEventListener('input', updateBudgetHint);

// Add loading messages rotation
const loadingMessages = [
    'Analyzing the best budget options...',
    'Finding student discounts...',
    'Discovering hidden gems...',
    'Planning sustainable routes...',
    'Consulting local experts...',
    'Optimizing your itinerary...'
];

let messageIndex = 0;
let messageInterval;

loadingOverlay.addEventListener('transitionend', () => {
    if (loadingOverlay.classList.contains('active')) {
        const loadingSubtext = document.querySelector('.loading-subtext');
        messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            loadingSubtext.textContent = loadingMessages[messageIndex];
        }, 3000);
    } else {
        clearInterval(messageInterval);
        messageIndex = 0;
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus destination input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('destination').focus();
    }
    
    // Ctrl/Cmd + S to save (when results are visible)
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentItinerary) {
        e.preventDefault();
        document.getElementById('saveBtn').click();
    }
    
    // Escape to close/reset
    if (e.key === 'Escape') {
        if (loadingOverlay.classList.contains('active')) {
            loadingOverlay.classList.remove('active');
        }
    }
});

// Auto-save form data to sessionStorage
const formInputs = document.querySelectorAll('#travelForm input, #travelForm select');
formInputs.forEach(input => {
    // Load saved value
    const savedValue = sessionStorage.getItem(input.id);
    if (savedValue && input.type !== 'hidden') {
        input.value = savedValue;
    }
    
    // Save on change
    input.addEventListener('change', () => {
        sessionStorage.setItem(input.id, input.value);
    });
});

// Load saved interests
const savedInterests = sessionStorage.getItem('selectedInterests');
if (savedInterests) {
    selectedInterests = JSON.parse(savedInterests);
    selectedInterests.forEach(interest => {
        const tag = document.querySelector(`[data-interest="${interest}"]`);
        if (tag) tag.classList.add('active');
    });
    interestsInput.value = selectedInterests.join(', ');
}

// Save interests on change
interestTags.forEach(tag => {
    tag.addEventListener('click', () => {
        sessionStorage.setItem('selectedInterests', JSON.stringify(selectedInterests));
    });
});

// Console easter egg
console.log('%c🌍 Student Travel AI', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; color: transparent;');
console.log('%cBuilt for students who love to explore!', 'font-size: 14px; color: #667eea;');
console.log('%cTip: Use Ctrl/Cmd + K to quickly start planning!', 'font-size: 12px; color: #94a3b8;');