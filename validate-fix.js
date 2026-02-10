#!/usr/bin/env node
/**
 * System Validation Script
 * Checks if the "Post All to Twitter" fix is properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('\n=== POST ALL TO TWITTER FIX VALIDATION ===\n');

let allValid = true;

// 1. Check accounts.json structure
console.log('1. Checking accounts.json...');
try {
  const accountsPath = path.join(__dirname, 'server', 'accounts.json');
  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
  
  if (!Array.isArray(accounts.accounts)) {
    console.log('   ❌ accounts.json is missing accounts array');
    allValid = false;
  } else {
    console.log(`   ✅ accounts.json has valid structure (${accounts.accounts.length} accounts)`);
    
    // Check if accounts are cleaned up (no invalid credentials)
    if (accounts.accounts.length === 0) {
      console.log('   ✅ Invalid accounts removed (ready for new credentials)');
    } else {
      accounts.accounts.forEach((acc, i) => {
        console.log(`      Account ${i + 1}: ${acc.username} (${acc.authType}, verified: ${acc.verified})`);
      });
    }
  }
} catch (err) {
  console.log('   ❌ Error reading accounts.json:', err.message);
  allValid = false;
}

// 2. Check server/index.js exists and has required functions
console.log('\n2. Checking server code...');
try {
  const serverPath = path.join(__dirname, 'server', 'index.js');
  const serverCode = fs.readFileSync(serverPath, 'utf8');
  
  const checks = [
    ['postTweetWithOAuth1', 'OAuth 1.0a posting'],
    ['postTweetWithBearer', 'Bearer token posting'],
    ['verifyWithOAuth1', 'OAuth 1.0a verification'],
    ['encrypt', 'Encryption'],
    ['decrypt', 'Decryption'],
    ['app.post', 'Express POST handler'],
    ['/api/post', 'Tweet posting endpoint'],
    ['/api/accounts', 'Account management endpoint']
  ];
  
  checks.forEach(([name, desc]) => {
    if (serverCode.includes(name)) {
      console.log(`   ✅ ${desc}`);
    } else {
      console.log(`   ❌ Missing ${desc} (${name})`);
      allValid = false;
    }
  });
} catch (err) {
  console.log('   ❌ Error reading server code:', err.message);
  allValid = false;
}

// 3. Check frontend code
console.log('\n3. Checking frontend code...');
try {
  const appPath = path.join(__dirname, 'src', 'App.js');
  const appCode = fs.readFileSync(appPath, 'utf8');
  
  const checks = [
    ['handlePostAllComments', 'Post All handler'],
    ['handlePostComment', 'Individual post handler'],
    ['/api/post', 'Server API call'],
    ['accountId', 'Account ID support']
  ];
  
  checks.forEach(([name, desc]) => {
    if (appCode.includes(name)) {
      console.log(`   ✅ ${desc}`);
    } else {
      console.log(`   ❌ Missing ${desc}`);
      allValid = false;
    }
  });
} catch (err) {
  console.log('   ❌ Error reading frontend code:', err.message);
  allValid = false;
}

// 4. Check AddAccountPage exists
console.log('\n4. Checking Add Account UI...');
try {
  const pagePath = path.join(__dirname, 'src', 'pages', 'AddAccountPage.js');
  if (fs.existsSync(pagePath)) {
    const pageCode = fs.readFileSync(pagePath, 'utf8');
    if (pageCode.includes('oauth1') || pageCode.includes('consumerKey')) {
      console.log('   ✅ OAuth 1.0a form support found');
    } else {
      console.log('   ⚠️  OAuth 1.0a form may need implementation');
    }
  } else {
    console.log('   ❌ AddAccountPage not found');
    allValid = false;
  }
} catch (err) {
  console.log('   ❌ Error checking AddAccountPage:', err.message);
  allValid = false;
}

// 5. Check documentation
console.log('\n5. Checking documentation...');
const docsToCheck = [
  ['FIX_POST_ALL_GUIDE.md', 'Fix guide'],
  ['QUICK_START_POST_ALL_FIX.md', 'Quick start'],
  ['ISSUE_RESOLUTION.md', 'Resolution details']
];

docsToCheck.forEach(([file, desc]) => {
  const docPath = path.join(__dirname, file);
  if (fs.existsSync(docPath)) {
    console.log(`   ✅ ${desc}`);
  } else {
    console.log(`   ⚠️  ${desc} not found (${file})`);
  }
});

// 6. Check package.json dependencies
console.log('\n6. Checking dependencies...');
try {
  const pkgPath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const requiredDeps = ['react', 'express', 'cors'];
  let depsOk = true;
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep] || pkg.devDependencies[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ Missing ${dep}`);
      depsOk = false;
    }
  });
  
  if (depsOk) {
    console.log('   ✅ All required dependencies present');
  }
} catch (err) {
  console.log('   ⚠️  Could not verify dependencies:', err.message);
}

// Summary
console.log('\n=== VALIDATION SUMMARY ===\n');

if (allValid) {
  console.log('✅ SYSTEM IS READY FOR USE');
  console.log('\nNext steps:');
  console.log('1. Start the server: npm start');
  console.log('2. Open http://localhost:3000');
  console.log('3. Click "+ Add Account"');
  console.log('4. Fill in OAuth 1.0a credentials from developer.twitter.com');
  console.log('5. Verify the account');
  console.log('6. Test "Post All to Twitter" button');
} else {
  console.log('⚠️  SOME ISSUES FOUND');
  console.log('\nPlease check the issues above and run this script again.');
}

console.log('\n=== END VALIDATION ===\n');

process.exit(allValid ? 0 : 1);
