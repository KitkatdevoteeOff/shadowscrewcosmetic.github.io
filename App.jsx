// ShadowsCrewSite.jsx
// React site for the Shadows Crew shop + mock auth + wallet
// Loads capes dynamically from a JSON file and displays textures from the /capes folder.
// ⚠️ Client-only demo; production should include secure backend + authentication.

import React, { useState, useEffect } from 'react';
import logo from './logo.png'; // logo located at the root

// Configuration du bot Discord
// ⚠️ Ne JAMAIS placer la clé API directement ici. Crée un fichier .env à la racine du projet avec :
// REACT_APP_DISCORD_API_KEY=ta_cle_api
// Ensuite, récupère-la via :
const DISCORD_API_KEY = process.env.REACT_APP_DISCORD_API_KEY;

const DB = {
  get(key, fallback) { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch(e){ return fallback; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

export default function ShadowsCrewSite() {
  const [capes, setCapes] = useState([]);
  const [user, setUser] = useState(DB.get('sc_user', null));
  const [balance, setBalance] = useState(DB.get('sc_balance', 0));
  const [showAuth, setShowAuth] = useState(false);
  const [message, setMessage] = useState('Bienvenue sur la boutique Shadows Crew !');
  const [cart, setCart] = useState([]);

  // Load capes from JSON file with new structure including name, texture, price, and owner
  useEffect(() => {
    fetch('/capes/capes.json')
      .then(res => res.json())
      .then(data => {
        // Normalize data if needed (convert price string to number, handle missing owner, etc.)
        const formatted = data.map(cape => ({
          name: cape.name || 'Cape inconnue',
          texture: cape.texture || 'default.png',
          price: parseInt(cape.price?.replace(/\D/g, '')) || 0,
          owner: cape.owner || 'Aucun propriétaire'
        }));
        setCapes(formatted);
      })
      .catch(err => console.error('Erreur de chargement des capes:', err));
  }, []);

  useEffect(()=>{ DB.set('sc_user', user); }, [user]);
  useEffect(()=>{ DB.set('sc_balance', balance); }, [balance]);
  useEffect(()=>{ DB.set('sc_cart', cart); }, [cart]);

  function register({username, password}){
    const users = DB.get('sc_users', {});
    if(users[username]){ setMessage('Ce pseudo existe déjà. Choisis-en un autre.'); return false; }
    users[username] = { username, password }; 
    DB.set('sc_users', users);
    setUser({ username });
    setBalance(0);
    setMessage(`Compte créé pour ${username}`);
    return true;
  }

  function login({username, password}){
    const users = DB.get('sc_users', {});
    if(users[username] && users[username].password === password){
      setUser({ username });
      setBalance(DB.get('sc_balance', 0));
      setMessage(`Connecté en tant que ${username}`);
      return true;
    }
    setMessage('Pseudo ou mot de passe incorrect.');
    return false;
  }

  function logout(){ setUser(null); setMessage('Déconnecté.'); }
  function addToCart(cape){ setCart(c => [...c, cape]); setMessage(`${cape.name} ajouté au panier.`); }
  function buyCart(){
    const sum = cart.reduce((s,i)=>s+i.price,0);
    if(!user){ setMessage('Connecte-toi pour acheter.'); return; }
    if(balance < sum){ setMessage(`Solde insuffisant — il manque ${sum-balance} ¥`); return; }
    setBalance(b => b - sum);
    const purchases = DB.get('sc_purchases', {});
    const u = user.username;
    purchases[u] = purchases[u] || [];
    purchases[u].push(...cart.map(c=>({ ...c, boughtAt: new Date().toISOString() })));
    DB.set('sc_purchases', purchases);
    setCart([]);
    setMessage('Achat réussi ! Tes capes sont disponibles dans ton inventaire.');
  }
  function viewInventory(){
    if(!user){ setMessage('Connecte-toi pour voir ton inventaire.'); return; }
    const purchases = DB.get('sc_purchases', {});
    const inv = purchases[user.username] || [];
    setMessage(`Inventaire: ${inv.map(i=>i.name).join(', ') || 'vide'}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 font-sans">
      <header className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Shadows Crew Logo" className="h-10 w-10 rounded-full" />
          <h1 className="text-3xl font-extrabold">Shadows Crew — Boutique</h1>
        </div>
        <div className="space-x-3">
          {user ? (
            <>
              <span className="px-3 py-1 bg-gray-700 rounded">{user.username}</span>
              <button onClick={logout} className="px-3 py-1 bg-red-600 rounded">Se déconnecter</button>
            </>
          ) : (
            <button onClick={()=>setShowAuth(true)} className="px-3 py-1 bg-indigo-600 rounded">Connexion / Inscription</button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="md:col-span-2 bg-gray-800 rounded p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-2">Annonce</h2>
          <p className="mb-4">Salut à tous les membres ! 🎉<br />Je suis super heureux de vous annoncer la sortie officielle des capes Shadows Crew !</p>
          <div className="mb-4 bg-gray-700 p-4 rounded">
            <strong>Ce que permet la boutique Discord :</strong>
            <ul className="list-disc ml-5 mt-2">
              <li>Mettre la main sur les capes exclusives</li>
              <li>Suivre un tuto détaillé pour les appliquer facilement</li>
              <li>Gérer une monnaie interne et des commandes</li>
            </ul>
          </div>
          <h3 className="text-lg font-semibold mb-2">Catalogue</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {capes.map((cape, i) => (
              <article key={i} className="bg-gray-900 p-4 rounded shadow">
                <div className="h-28 bg-gray-800 rounded flex items-center justify-center">
                  <img src={`/capes/${cape.texture}`} alt={cape.name} className="max-h-24 object-contain" />
                </div>
                <h4 className="mt-3 font-bold">{cape.name}</h4>
                <p className="text-sm text-gray-400">Propriétaire : {cape.owner}</p>
                <div className="mt-3 flex items-center justify-between">
                  <strong>{cape.price} ¥</strong>
                  <button onClick={()=>addToCart(cape)} className="px-2 py-1 bg-green-600 rounded">Ajouter</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="bg-gray-900 rounded p-6 shadow">
          <div className="mb-4">
            <h3 className="font-bold">Solde</h3>
            <p className="text-2xl">{balance} ¥</p>
            <small className="text-gray-400">Les gains et la monnaie sont gérés automatiquement par le bot Discord Shadows Crew.</small>
          </div>
          <div className="mb-3">
            <h4 className="font-semibold">Panier</h4>
            <ul className="text-sm mt-2">
              {cart.length === 0 ? <li>Vide</li> : cart.map((c,i)=>(<li key={i}>{c.name} — {c.price} ¥</li>))}
            </ul>
            <div className="flex gap-2 mt-3">
              <button onClick={buyCart} className="flex-1 px-3 py-2 bg-green-700 rounded">Acheter</button>
              <button onClick={()=>setCart([])} className="flex-1 px-3 py-2 bg-gray-600 rounded">Vider</button>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={viewInventory} className="w-full px-3 py-2 bg-indigo-600 rounded">Voir l'inventaire</button>
          </div>
          <div className="mt-4 text-gray-400 text-sm bg-gray-800 p-3 rounded">
            Les messages de commande et la récupération d'argent sont effectués par le bot Discord Shadows Crew dans le channel <code>#1430177740291702814</code>.
          </div>
          <div className="mt-3 text-xs text-gray-500">
            API Discord chargée depuis <code>.env</code> : {DISCORD_API_KEY ? '✅ Disponible' : '❌ Non configurée'}
          </div>
        </aside>
      </main>

      <footer className="max-w-4xl mx-auto mt-8 text-gray-400 text-sm">{message}</footer>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onRegister={register} onLogin={login} />}
    </div>
  );
}

function AuthModal({ onClose, onRegister, onLogin }){
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function submit(e){
    e.preventDefault();
    if(mode === 'login') onLogin({ username, password });
    else onRegister({ username, password });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <form onSubmit={submit} className="bg-gray-800 p-6 rounded w-96">
        <h3 className="text-xl font-bold mb-3">{mode === 'login' ? 'Connexion' : 'Inscription'}</h3>
        <div className="mb-2">
          <label className="block text-sm">Pseudo</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full mt-1 p-2 rounded bg-gray-700" />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Mot de passe</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full mt-1 p-2 rounded bg-gray-700" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="flex-1 px-3 py-2 bg-indigo-600 rounded">{mode === 'login' ? 'Se connecter' : 'S\'inscrire'}</button>
          <button type="button" onClick={onClose} className="px-3 py-2 bg-gray-600 rounded">Annuler</button>
        </div>
        <div className="mt-3 text-sm text-gray-400">
          <button type="button" onClick={()=>setMode(mode==='login'?'register':'login')}>{mode==='login'?'Créer un compte':"J'ai déjà un compte"}</button>
        </div>
      </form>
    </div>
  );
}
