<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dog Walking Service</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
</head>
<body class="bg-light">
  <div id="app" class="container py-5">
    <h1 class="mb-4 text-primary">{{ message }}</h1>
    <p class="lead">Connect with trusted walkers for your beloved dog!</p>

    <div class="mb-4">
      <a href="owner-dashboard.html" class="btn btn-outline-primary me-2">Owner Dashboard</a>
      <a href="walker-dashboard.html" class="btn btn-outline-success">Walker Dashboard</a>
    </div>

    <hr class="my-5">
    <h2 class="text-secondary">All Registered Dogs</h2>
    <table class="table table-bordered mt-3">
      <thead class="table-light">
        <tr>
          <th>Photo</th>
          <th>Name</th>
          <th>Size</th>
          <th>Owner</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="dog in dogs" :key="dog.name">
          <td><img :src="dog.image" alt="Dog Photo" width="100" height="100" class="rounded"></td>
          <td>{{ dog.name }}</td>
          <td>{{ dog.size }}</td>
          <td>{{ dog.owner }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <script>
    const { createApp } = Vue;
    createApp({
      data() {
        return {
          message: 'Welcome to the Dog Walking Service!',
          dogs: []
        };
      },
      async mounted() {
        try {
          const res = await fetch('http://localhost:8080/api/dogs');
          const data = await res.json();

          const dogsWithPhotos = await Promise.all(data.map(async (dog) => {
            const imgRes = await fetch('https://dog.ceo/api/breeds/image/random');
            const imgData = await imgRes.json();
            return {
              name: dog.name,
              size: dog.size,
              owner: dog.owner_username || 'Unknown',
              image: imgData.message
            };
          }));

          this.dogs = dogsWithPhotos;
        } catch (err) {
          console.error('Error fetching dogs:', err);
        }
      }
    }).mount('#app');
  </script>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>