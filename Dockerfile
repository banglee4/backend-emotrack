# Gunakan Node.js LTS image
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies (production saja, kalau tidak butuh devDependencies)
RUN npm install --only=production

# Copy semua file ke container
COPY . .

# Set environment variable PORT (opsional)
ENV PORT=3000

# Expose port yang digunakan Express.js
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "start"]

