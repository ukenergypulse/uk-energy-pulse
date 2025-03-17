// Sample blog posts data - in a real app, this would come from a backend
const blogPosts = [
    {
        id: 1,
        title: "Understanding UK's Energy Mix: A Deep Dive",
        date: "2025-02-20",
        author: "Energy Analyst",
        content: `
            <p>The UK's energy landscape has undergone significant transformation in recent years. 
            Let's explore the current state of our energy mix and what it means for the future.</p>
            
            <p>Wind power, both offshore and onshore, has become a cornerstone of UK's renewable 
            energy strategy. In 2024, wind farms contributed an average of 24% to our total 
            electricity generation, with this figure rising to over 50% during particularly 
            windy periods.</p>
            
            <p>Meanwhile, nuclear power continues to provide reliable baseload generation, 
            typically accounting for 15-20% of our electricity needs. This combination of 
            renewable and nuclear power has helped the UK significantly reduce its reliance 
            on fossil fuels.</p>
        `,
        tags: ["renewables", "nuclear", "analysis"]
    },
    {
        id: 2,
        title: "The Role of Interconnectors in UK's Energy Security",
        date: "2025-02-19",
        author: "Grid Expert",
        content: `
            <p>Interconnectors play a crucial role in maintaining the UK's energy security 
            and helping to balance our electricity grid. These high-voltage cables connect 
            Britain to neighboring countries, allowing us to trade electricity when needed.</p>
            
            <p>The UK currently has interconnectors with France, Netherlands, Belgium, and 
            Norway, with a total capacity of over 8GW. This connectivity helps reduce electricity 
            prices and provides access to diverse energy sources.</p>
        `,
        tags: ["interconnectors", "infrastructure", "energy security"]
    }
];

// Function to render blog posts
function renderBlogPosts() {
    const blogPostsContainer = document.querySelector('.blog-posts');
    
    blogPosts.forEach(post => {
        const postElement = document.createElement('article');
        postElement.className = 'blog-post';
        
        postElement.innerHTML = `
            <h2>${post.title}</h2>
            <div class="blog-post-meta">
                Posted on ${post.date} by ${post.author}
            </div>
            <div class="blog-post-content">
                ${post.content}
            </div>
            <div class="blog-post-tags">
                ${post.tags.map(tag => `<span class="blog-post-tag">${tag}</span>`).join('')}
            </div>
        `;
        
        blogPostsContainer.appendChild(postElement);
    });
}

// Initialize blog
document.addEventListener('DOMContentLoaded', () => {
    renderBlogPosts();
});
