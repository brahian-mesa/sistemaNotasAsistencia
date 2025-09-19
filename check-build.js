#!/usr/bin/env node

// Script para verificar el build antes del despliegue
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verificando configuración de build...\n');

// 1. Verificar variables de entorno
console.log('📋 Variables de entorno:');
const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
  }
});

// 2. Verificar archivos necesarios
console.log('\n📁 Archivos necesarios:');
const requiredFiles = [
  'package.json',
  'vite.config.js',
  'index.html',
  'src/main.jsx',
  'src/App.jsx',
  'vercel.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}: NO ENCONTRADO`);
  }
});

// 3. Verificar dependencias
console.log('\n📦 Dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'react',
    'react-dom',
    'react-router-dom',
    '@supabase/supabase-js',
    'vite'
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep}: NO INSTALADA`);
    }
  });
} catch (error) {
  console.log('❌ Error leyendo package.json:', error.message);
}

// 4. Intentar build
console.log('\n🔨 Probando build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build exitoso');
  
  // Verificar que se creó la carpeta dist
  if (fs.existsSync('dist')) {
    console.log('✅ Carpeta dist creada');
    
    // Verificar archivos importantes en dist
    const distFiles = ['index.html'];
    distFiles.forEach(file => {
      if (fs.existsSync(path.join('dist', file))) {
        console.log(`✅ dist/${file}`);
      } else {
        console.log(`❌ dist/${file}: NO ENCONTRADO`);
      }
    });
  } else {
    console.log('❌ Carpeta dist NO creada');
  }
} catch (error) {
  console.log('❌ Error en build:', error.message);
}

console.log('\n📋 Instrucciones para Vercel:');
console.log('1. Configura las variables de entorno en Vercel Dashboard');
console.log('2. Asegúrate de que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén definidas');
console.log('3. Redespliega tu aplicación');
console.log('\n🔗 URLs útiles:');
console.log('- Vercel Dashboard: https://vercel.com/dashboard');
console.log('- Supabase Dashboard: https://supabase.com/dashboard');