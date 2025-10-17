# Carousel Partial Usage Guide

The carousel partial provides a reusable carousel component that can be used across all views that need carousel functionality.

## Basic Usage

Include the carousel CSS in your view's head section:
```html
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css"/>
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.min.css"/>
<link rel="stylesheet" type="text/css" href="/static/css/carousel.css">
```

Include jQuery and Slick carousel JavaScript (only once per page):
```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js"></script>
```

## Character Image Carousel

```html
<%- include('partials/carousel', {
    carouselId: 'character-carousel',
    items: characterImages,
    type: 'character',
    showModal: true
}) %>
```

## Episode Image Carousel

```html
<%- include('partials/carousel', {
    carouselId: 'episode-carousel', 
    items: episodeImages,
    type: 'episode',
    showModal: true
}) %>
```

## Season Episode Carousel (for index page)

```html
<% Object.keys(videos).forEach(season => { %>
    <%- include('partials/carousel', {
        carouselId: `carousel-${season}`,
        items: videos[season].episodes,
        type: 'season',
        seasonNumber: season.replace('season', ''),
        showModal: false
    }) %>
<% }); %>
```

## Custom Options

You can override default carousel settings by passing an options object:

```html
<%- include('partials/carousel', {
    carouselId: 'custom-carousel',
    items: images,
    type: 'character',
    options: {
        autoplay: false,
        slidesToShow: 4,
        arrows: false
    }
}) %>
```

## Parameters

- **carouselId** (required): Unique identifier for the carousel
- **items** (required): Array of items to display
- **type** (required): 'character', 'episode', or 'season'
- **showModal** (optional): Whether to include modal functionality (default: true)
- **seasonNumber** (required for 'season' type): Season number for URL generation
- **options** (optional): Object to override default Slick carousel settings

## Default Settings

```javascript
{
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    dots: true,
    arrows: true
}
```

The carousel automatically shows 2 slides on mobile devices (screen width <= 768px) regardless of the slidesToShow setting.

## Converting Existing Views

### character.ejs replacement:
Replace the existing carousel section with:
```html
<%- include('partials/carousel', {
    carouselId: 'character-carousel',
    items: shuffledImages,
    type: 'character'
}) %>
```

### episode.ejs replacement:
Replace the existing carousel section with:
```html
<%- include('partials/carousel', {
    carouselId: 'episode-carousel',
    items: episodeImages,
    type: 'episode'
}) %>
```

### about.ejs replacement:
Replace the existing carousel section with:
```html
<%- include('partials/carousel', {
    carouselId: 'character-carousel',
    items: characterImages,
    type: 'character'
}) %>
```

### index.ejs replacement:
Replace each season carousel with:
```html
<% Object.keys(videos).forEach(season => { %>
    <div class="season-header">
        <h2><%= videos[season].title %></h2>
        <p class="season-description"><%= videos[season].description %></p>
        <a href="<%= videos[season].seasonLink %>" target="_blank" class="center-link">Watch Full Season</a>
    </div>
    
    <%- include('partials/carousel', {
        carouselId: `carousel-${season}`,
        items: videos[season].episodes,
        type: 'season',
        seasonNumber: season.replace('season', '')
    }) %>
<% }); %>
```