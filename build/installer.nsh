name: Build Multi-Platform

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        include:
          - os: windows-latest
            platform: win
            command: npm run dist:win
          - os: macos-latest
            platform: mac
            command: npm run dist:mac

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build application
      run: ${{ matrix.command }}
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: ${{ matrix.platform }}-build
        path: dist/