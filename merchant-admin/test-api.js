// 简单的API测试脚本
const API_BASE_URL = 'http://localhost:8081';

// 测试登录
async function testLogin() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.success && data.data.token) {
      return data.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// 测试获取用户信息
async function testGetProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    console.log('Get profile response:', data);
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

// 测试更新用户信息
async function testUpdateProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 1,
        username: 'admin',
        realName: '系统管理员',
        email: 'admin@example.com'
      })
    });
    
    const data = await response.json();
    console.log('Update profile response:', data);
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    return null;
  }
}

// 运行测试
async function runTests() {
  console.log('Starting API tests...');
  
  // 测试登录
  console.log('\n1. Testing login...');
  const token = await testLogin();
  
  if (!token) {
    console.error('Login failed, cannot continue tests');
    return;
  }
  
  // 测试获取用户信息
  console.log('\n2. Testing get profile...');
  await testGetProfile(token);
  
  // 测试更新用户信息
  console.log('\n3. Testing update profile...');
  await testUpdateProfile(token);
  
  console.log('\nAPI tests completed!');
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
  runTests();
} 