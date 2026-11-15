/* Dados ficam no localStorage do navegador (não há servidor). Serve para a demonstração do trabalho. */
const $ = (s) => document.querySelector(s);
const ler = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao; } catch { return padrao; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const msg = (texto, ok = false) => { const m = $('.msg'); if (m) { m.textContent = texto; m.className = 'msg' + (ok ? ' ok' : ''); } };

async function hash(texto) {
  if (!window.crypto || !crypto.subtle) return texto;
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/* ---------- Preferências (todas as páginas) ---------- */
function aplicarPreferencias() {
  const p = ler('prefs', { escuro: false, tamanho: '.7rem' });
  document.body.classList.toggle('escuro', p.escuro);
  document.documentElement.style.setProperty('--fonte', p.tamanho);
  return p;
}
const prefs = aplicarPreferencias();

const sessao = () => ler('sessao', null);
if (sessao() && $('#linkLogin')) $('#linkLogin').textContent = 'Olá, ' + sessao().nome;

/* ---------- Criar conta ---------- */
$('#formConta')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = $('#nome').value.trim(), email = $('#email').value.trim().toLowerCase();
  const senha = $('#senha').value, senha2 = $('#senha2').value;
  if (!nome || !/^\S+@\S+\.\S+$/.test(email)) return msg('Preencha o nome e um e-mail válido.');
  if (senha.length < 6) return msg('A senha precisa ter pelo menos 6 caracteres.');
  if (senha !== senha2) return msg('As senhas não são iguais.');
  const usuarios = ler('usuarios', []);
  if (usuarios.some((u) => u.email === email)) return msg('Este e-mail já tem conta. Faça login.');
  usuarios.push({ nome, email, senha: await hash(senha) });
  gravar('usuarios', usuarios);
  msg('Conta criada! Indo para o login...', true);
  setTimeout(() => (location.href = 'login.html'), 1200);
});

/* ---------- Login ---------- */
$('#btnLogin')?.addEventListener('click', async () => {
  const email = $('#email').value.trim().toLowerCase(), senha = await hash($('#senha').value);
  const u = ler('usuarios', []).find((x) => x.email === email && x.senha === senha);
  if (!u) return msg('E-mail ou senha incorretos.');
  gravar('sessao', { nome: u.nome, email: u.email });
  location.href = 'post.html';
});

/* ---------- Posts ---------- */
function desenharFeed() {
  const feed = $('#feed'); if (!feed) return;
  const posts = ler('posts', []);
  feed.textContent = '';
  if (!posts.length) { feed.textContent = 'Nenhum post ainda. Seja o primeiro a publicar!'; return; }
  posts.slice().reverse().forEach((p) => {
    const d = document.createElement('article'); d.className = 'post';
    const h = document.createElement('h3'); h.textContent = p.titulo;
    const j = document.createElement('small'); j.textContent = `${p.jogo} · por ${p.autor} · ${new Date(p.data).toLocaleDateString('pt-BR')}`;
    const t = document.createElement('p'); t.textContent = p.descricao;
    d.append(h, j, t);
    if (p.imagem) { const i = document.createElement('img'); i.src = p.imagem; i.alt = 'Imagem de ' + p.jogo; d.append(i); }
    feed.append(d);
  });
}

/* Reduz a imagem para caber no localStorage (limite ~5 MB no total) */
function reduzirImagem(arquivo) {
  return new Promise((ok, erro) => {
    const img = new Image(), url = URL.createObjectURL(arquivo);
    img.onload = () => {
      const f = Math.min(1, 600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = img.width * f; c.height = img.height * f;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => erro(new Error('imagem inválida'));
    img.src = url;
  });
}

let imagemAtual = '';
$('#imagem')?.addEventListener('change', async (e) => {
  const a = e.target.files[0]; if (!a) return;
  if (a.size > 5 * 1024 * 1024) { e.target.value = ''; return msg('A imagem passa de 5 MB.'); }
  try { imagemAtual = await reduzirImagem(a); } catch { return msg('Não consegui ler essa imagem.'); }
  $('#previewImg').src = imagemAtual; $('#imagePreview').hidden = false; msg('');
});
$('#removeImg')?.addEventListener('click', () => { imagemAtual = ''; $('#imagem').value = ''; $('#imagePreview').hidden = true; });

$('#formPost')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const s = sessao();
  if (!s) return msg('Faça login para publicar.');
  const posts = ler('posts', []);
  posts.push({ titulo: $('#titulo').value.trim(), jogo: $('#nome').value.trim(),
    descricao: $('#descricao').value.trim(), imagem: imagemAtual, autor: s.nome, data: Date.now() });
  if (!gravar('posts', posts)) return msg('Sem espaço para salvar. Tente uma imagem menor.');
  e.target.reset(); imagemAtual = ''; $('#imagePreview').hidden = true;
  msg('Publicado!', true); desenharFeed();
});
desenharFeed();

/* ---------- Configurações ---------- */
if ($('#tema')) {
  $('#tema').checked = prefs.escuro; $('#tamanho').value = prefs.tamanho;
  const salvar = () => { gravar('prefs', { escuro: $('#tema').checked, tamanho: $('#tamanho').value }); aplicarPreferencias(); };
  $('#tema').addEventListener('change', salvar); $('#tamanho').addEventListener('change', salvar);
  if (sessao()) $('#statusConta').textContent = 'Logado como ' + sessao().nome + '.';
  $('#sair').addEventListener('click', () => { localStorage.removeItem('sessao'); location.href = 'login.html'; });
  $('#apagar').addEventListener('click', () => {
    if (confirm('Apagar contas, posts e preferências deste navegador?')) { localStorage.clear(); location.reload(); }
  });
}
