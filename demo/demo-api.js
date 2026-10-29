/*
 * Mode démo de Piiquante (TheHottestReviews).
 * L’API Node/Express/MongoDB du projet est simulée dans le navigateur :
 * les données sont gardées dans le localStorage du visiteur et les sauces
 * de départ viennent de sauces.json.
 */
(function () {
  'use strict';

  var API_URL = /^https?:\/\/localhost:3000\/api\/(.*)$/;
  var USERS_KEY = 'piiquante_demo_users';
  var SAUCES_KEY = 'piiquante_demo_sauces';
  var BANNER_KEY = 'piiquante_demo_banner';
  var DEMO_USER = { userId: 'demo-user', email: 'demo@piiquante.fr', password: 'Demo1234' };
  var RESPONSE_DELAY = 150;
  var STATUS_TEXT = { 200: 'OK', 201: 'Created', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 500: 'Internal Server Error' };

  var nativeOpen = XMLHttpRequest.prototype.open;
  var nativeSend = XMLHttpRequest.prototype.send;
  var nativeSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

  var state = { users: readStorage(USERS_KEY), sauces: readStorage(SAUCES_KEY) };

  /* ---------- Stockage ---------- */

  function readStorage(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      /* Stockage plein ou bloqué : les données restent en mémoire pour la session. */
    }
  }

  /* ---------- Outils ---------- */

  function uid() {
    return Math.random().toString(16).slice(2, 10) + Date.now().toString(16);
  }

  function sha256(text) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buffer) {
        return Array.prototype.map.call(new Uint8Array(buffer), function (byte) {
          return ('0' + byte.toString(16)).slice(-2);
        }).join('');
      });
    }
    return Promise.resolve('plain:' + text);
  }

  function escapeXml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Illustration générée pour les sauces sans photo (aucune image externe). */
  function bottleArt(name) {
    var colors = ['#c0392b', '#e67e22', '#d35400', '#8e2a1e', '#a93226', '#b9770e'];
    var seed = 0;
    for (var i = 0; i < name.length; i++) {
      seed += name.charCodeAt(i);
    }
    var color = colors[seed % colors.length];
    var initial = escapeXml((name.charAt(0) || '?').toUpperCase());
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="' + color + '"/>' +
      '<rect x="150" y="50" width="100" height="40" rx="8" fill="#2c3e50"/>' +
      '<rect x="165" y="88" width="70" height="50" fill="#ecf0f1"/>' +
      '<rect x="115" y="130" width="170" height="240" rx="40" fill="#f7f7f7"/>' +
      '<text x="200" y="280" font-family="Arial, sans-serif" font-size="96" font-weight="700" text-anchor="middle" fill="' + color + '">' + initial + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* Réduit la photo envoyée par le visiteur pour tenir dans le localStorage. */
  function fileToImage(file) {
    return new Promise(function (resolve) {
      if (!file) {
        resolve(null);
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { resolve(null); };
      reader.onload = function () {
        var image = new Image();
        image.onerror = function () { resolve(null); };
        image.onload = function () {
          var ratio = Math.min(1, 480 / Math.max(image.width, image.height));
          var canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * ratio));
          canvas.height = Math.max(1, Math.round(image.height * ratio));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function readBody(body) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      var data = {};
      var file = null;
      body.forEach(function (value, key) {
        if (key === 'sauce' && typeof value === 'string') {
          try { data = JSON.parse(value); } catch (error) { data = {}; }
        } else if (key === 'image' && value instanceof File) {
          file = value;
        }
      });
      return { data: data, file: file };
    }
    if (typeof body === 'string') {
      try { return { data: JSON.parse(body), file: null }; } catch (error) { /* corps invalide */ }
    }
    return { data: {}, file: null };
  }

  function reply(status, body) {
    return { status: status, body: body };
  }

  /* ---------- Données de départ ---------- */

  function ensureUsers() {
    if (state.users) {
      return Promise.resolve(state.users);
    }
    return sha256(DEMO_USER.email + ':' + DEMO_USER.password).then(function (hash) {
      state.users = [{ userId: DEMO_USER.userId, email: DEMO_USER.email, hash: hash }];
      writeStorage(USERS_KEY, state.users);
      return state.users;
    });
  }

  function ensureSauces() {
    if (state.sauces) {
      return Promise.resolve(state.sauces);
    }
    return fetch(new URL('sauces.json', document.baseURI).href)
      .then(function (response) { return response.json(); })
      .then(function (list) {
        state.sauces = list.map(function (sauce) {
          if (!sauce.imageUrl) {
            sauce.imageUrl = bottleArt(sauce.name || '');
          }
          return sauce;
        });
        writeStorage(SAUCES_KEY, state.sauces);
        return state.sauces;
      })
      .catch(function () {
        state.sauces = [];
        return state.sauces;
      });
  }

  /* ---------- Routes de l’API ---------- */

  function currentUserId(headers) {
    var match = /^Bearer demo\.(.+)$/.exec(headers.authorization || '');
    return match ? match[1] : null;
  }

  function handleAuth(method, action, body) {
    var data = readBody(body).data;
    var email = String(data.email || '').trim().toLowerCase();
    var password = String(data.password || '');
    if (method !== 'POST' || !email || !password) {
      return Promise.resolve(reply(400, { error: 'Email et mot de passe requis' }));
    }
    return ensureUsers().then(function (users) {
      return sha256(email + ':' + password).then(function (hash) {
        var user = users.filter(function (item) { return item.email === email; })[0];
        if (action === 'signup') {
          if (password.length < 8) {
            return reply(400, { error: 'Le mot de passe doit contenir au moins 8 caractères' });
          }
          if (user) {
            return reply(400, { error: 'Cet email est déjà utilisé' });
          }
          users.push({ userId: uid(), email: email, hash: hash });
          writeStorage(USERS_KEY, users);
          return reply(201, { message: 'Utilisateur créé !' });
        }
        if (action === 'login') {
          if (!user) {
            return reply(401, { error: 'Utilisateur non trouvé !' });
          }
          if (user.hash !== hash) {
            return reply(401, { error: 'Mot de passe incorrect !' });
          }
          return reply(200, { userId: user.userId, token: 'demo.' + user.userId });
        }
        return reply(404, { error: 'Route inconnue' });
      });
    });
  }

  function createSauce(sauces, userId, body) {
    var request = readBody(body);
    return fileToImage(request.file).then(function (image) {
      var input = request.data;
      var sauce = {
        _id: uid(),
        userId: userId,
        name: input.name,
        manufacturer: input.manufacturer,
        description: input.description,
        mainPepper: input.mainPepper,
        heat: input.heat,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
      };
      sauce.imageUrl = image || bottleArt(String(sauce.name || ''));
      sauces.push(sauce);
      writeStorage(SAUCES_KEY, sauces);
      return reply(201, { message: 'Object saved' });
    });
  }

  function modifySauce(sauces, sauce, userId, body) {
    if (sauce.userId !== userId) {
      return Promise.resolve(reply(400, { error: 'Requête non autorisée !' }));
    }
    var request = readBody(body);
    return fileToImage(request.file).then(function (image) {
      ['name', 'manufacturer', 'description', 'mainPepper', 'heat'].forEach(function (field) {
        if (request.data[field] !== undefined) {
          sauce[field] = request.data[field];
        }
      });
      if (image) {
        sauce.imageUrl = image;
      }
      writeStorage(SAUCES_KEY, sauces);
      return reply(201, { message: 'Modified object' });
    });
  }

  function deleteSauce(sauces, sauce, userId) {
    if (sauce.userId !== userId) {
      return reply(400, { error: 'Requête non autorisée !' });
    }
    sauces.splice(sauces.indexOf(sauce), 1);
    writeStorage(SAUCES_KEY, sauces);
    return reply(200, { message: 'Deleted object' });
  }

  function likeSauce(sauces, sauce, userId, body) {
    var data = readBody(body).data;
    var who = data.userId || userId;
    var value = Number(data.like);
    sauce.usersLiked = (sauce.usersLiked || []).filter(function (id) { return id !== who; });
    sauce.usersDisliked = (sauce.usersDisliked || []).filter(function (id) { return id !== who; });
    if (value === 1) {
      sauce.usersLiked.push(who);
    } else if (value === -1) {
      sauce.usersDisliked.push(who);
    }
    sauce.likes = sauce.usersLiked.length;
    sauce.dislikes = sauce.usersDisliked.length;
    writeStorage(SAUCES_KEY, sauces);
    return reply(200, { message: 'Like updated' });
  }

  function handleSauces(method, parts, userId, body) {
    return ensureSauces().then(function (sauces) {
      var id = parts[1];
      if (!id) {
        if (method === 'GET') {
          return reply(200, sauces);
        }
        if (method === 'POST') {
          return createSauce(sauces, userId, body);
        }
        return reply(404, { error: 'Route inconnue' });
      }
      var sauce = sauces.filter(function (item) { return item._id === id; })[0];
      if (!sauce) {
        return reply(404, { error: 'Sauce introuvable' });
      }
      if (parts[2] === 'like' && method === 'POST') {
        return likeSauce(sauces, sauce, userId, body);
      }
      if (method === 'GET') {
        return reply(200, sauce);
      }
      if (method === 'PUT') {
        return modifySauce(sauces, sauce, userId, body);
      }
      if (method === 'DELETE') {
        return deleteSauce(sauces, sauce, userId);
      }
      return reply(404, { error: 'Route inconnue' });
    });
  }

  function route(method, path, headers, body) {
    var parts = path.split('?')[0].replace(/\/+$/, '').split('/');
    if (parts[0] === 'auth') {
      return handleAuth(method, parts[1], body);
    }
    if (parts[0] === 'sauces') {
      var userId = currentUserId(headers);
      if (!userId) {
        return Promise.resolve(reply(401, { error: 'Requête non authentifiée !' }));
      }
      return handleSauces(method, parts, userId, body);
    }
    return Promise.resolve(reply(404, { error: 'Route inconnue' }));
  }

  /* ---------- Interception des requêtes XMLHttpRequest d’Angular ---------- */

  function finish(xhr, url, result) {
    var text = JSON.stringify(result.body);
    var fields = {
      readyState: 4,
      status: result.status,
      statusText: STATUS_TEXT[result.status] || '',
      responseURL: url,
      responseText: text,
      response: xhr.responseType === 'json' ? JSON.parse(text) : text
    };
    Object.keys(fields).forEach(function (key) {
      Object.defineProperty(xhr, key, { value: fields[key], configurable: true });
    });
    xhr.getAllResponseHeaders = function () { return 'content-type: application/json\r\n'; };
    xhr.getResponseHeader = function (name) { return /^content-type$/i.test(name) ? 'application/json' : null; };
    xhr.dispatchEvent(new ProgressEvent('load'));
    xhr.dispatchEvent(new ProgressEvent('loadend'));
  }

  XMLHttpRequest.prototype.open = function (method, url) {
    var match = API_URL.exec(String(url));
    this.__demo = match ? { method: String(method).toUpperCase(), url: String(url), path: match[1], headers: {} } : null;
    if (this.__demo) {
      return nativeOpen.call(this, method, window.location.href);
    }
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this.__demo) {
      this.__demo.headers[String(name).toLowerCase()] = String(value);
    }
    return nativeSetRequestHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var demo = this.__demo;
    if (!demo) {
      return nativeSend.apply(this, arguments);
    }
    var xhr = this;
    route(demo.method, demo.path, demo.headers, body)
      .catch(function () { return reply(500, { error: 'Erreur de démonstration' }); })
      .then(function (result) {
        window.setTimeout(function () { finish(xhr, demo.url, result); }, RESPONSE_DELAY);
      });
  };

  /* ---------- Bandeau d’information ---------- */

  function showBanner() {
    try {
      if (window.sessionStorage.getItem(BANNER_KEY) === 'closed') {
        return;
      }
    } catch (error) { /* sessionStorage indisponible */ }
    var banner = document.createElement('div');
    banner.setAttribute('role', 'note');
    banner.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;max-width:340px;padding:10px 12px;' +
      'border-radius:10px;background:#1f2933;color:#fff;font:13px/1.45 Roboto,Arial,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)';
    banner.innerHTML = '<strong>Mode démo</strong> : l’API est simulée dans votre navigateur ' +
      '(les données restent sur votre appareil).<br>Compte test : <code style="color:#ffd1b0">' + DEMO_USER.email + '</code> / <code style="color:#ffd1b0">' +
      DEMO_USER.password + '</code><br><a href="#" data-reset style="color:#ffb27a">Réinitialiser la démo</a> · ' +
      '<a href="#" data-close style="color:#ffb27a">Fermer</a>';
    banner.querySelector('[data-close]').addEventListener('click', function (event) {
      event.preventDefault();
      try { window.sessionStorage.setItem(BANNER_KEY, 'closed'); } catch (error) { /* ignoré */ }
      banner.remove();
    });
    banner.querySelector('[data-reset]').addEventListener('click', function (event) {
      event.preventDefault();
      try {
        window.localStorage.removeItem(USERS_KEY);
        window.localStorage.removeItem(SAUCES_KEY);
      } catch (error) { /* ignoré */ }
      window.location.href = document.baseURI;
    });
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();
