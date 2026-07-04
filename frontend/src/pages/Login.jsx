const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const res = await fetch('https://aquasentinel-backend-v2.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (res.ok) {
      const data = await res.json();
      login(data);

      if (data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.role === 'HEALTH_WORKER') {
        navigate('/worker/dashboard');
      } else {
        navigate('/citizen/dashboard');
      }
    } else {
      let errorMsg = 'Authentication failed';

      try {
        const data = await res.json();
        errorMsg = data.message || errorMsg;
      } catch { }

      setError(errorMsg);
    }
  } catch (err) {
    console.error(err);
    setError('Unable to establish connection with AquaSentinel server.');
  } finally {
    setLoading(false);
  }
};