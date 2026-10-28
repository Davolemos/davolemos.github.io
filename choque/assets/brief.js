// choque — brief de proyecto (página /brief/)
// Entrevista guiada: el cliente elige branding, empaque o los dos y responde una sección a la vez.
// Todo se guarda en su navegador mientras avanza; al final ve el resumen y lo envía (Netlify Forms, "brief-proyecto").
// Usa de main.js: lang, count, SOURCE.
(() => {
  const app = document.getElementById('brief-app');
  if (!app) return;
  const KEY = 'choque-brief-v1';
  const tx = (a) => (Array.isArray(a) ? (lang === 'en' ? a[1] : a[0]) : a);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const NOSE = '__nose';

  // ---------- Pictogramas ----------
  const STAR = 'M29.4 24l9.1-9c.5-.5.1-1.3-.5-1.3h-8.8V5.1c0-.7-.8-1-1.3-.5L19.1 13.4 10.3 4.6c-.5-.5-1.3-.1-1.3.5v8.6H.7c-.7 0-1 .8-.5 1.3L9.3 24 .2 33c-.5.5-.1 1.3.5 1.3H9v8.6c0 .7.8 1 1.3.5l8.9-8.8 8.8 8.8c.5.5 1.3.1 1.3-.5v-8.6h8.8c.7 0 1-.8.5-1.3z';
  const svg = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const ICON = {
    branding: svg(`<path d="${STAR}" fill="currentColor" stroke="none" transform="translate(5 0) scale(.95)"/>`),
    empaque: svg('<path d="M24 6l16 8v20l-16 8-16-8V14z"/><path d="M8 14l16 8 16-8M24 22v20"/>'),
    ambos: svg(`<path d="${STAR}" fill="currentColor" stroke="none" transform="translate(2 2) scale(.55)"/><path d="M33 20l10 5v12l-10 5-10-5V25z"/><path d="M23 25l10 5 10-5M33 30v12"/>`),
    tipografico: svg('<text x="24" y="33" text-anchor="middle" font-size="24" font-weight="600" fill="currentColor" stroke="none" font-family="Instrument Sans, sans-serif">Aa</text>'),
    monograma: svg('<circle cx="24" cy="24" r="17"/><text x="24" y="30.5" text-anchor="middle" font-size="17" font-weight="600" fill="currentColor" stroke="none" font-family="Instrument Sans, sans-serif" letter-spacing="-1">AB</text>'),
    logosimbolo: svg(`<path d="${STAR}" fill="currentColor" stroke="none" transform="translate(3 13) scale(.45)"/><path d="M25 20h17M25 28h12"/>`),
    isotipo: svg(`<path d="${STAR}" fill="currentColor" stroke="none" transform="translate(8 4) scale(.8)"/>`),
    emblema: svg('<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="13"/><path d="M16 24h16"/>'),
    mascota: svg('<circle cx="24" cy="25" r="15"/><circle cx="18.5" cy="22" r="1.6" fill="currentColor"/><circle cx="29.5" cy="22" r="1.6" fill="currentColor"/><path d="M18.5 29.5c3 3 8 3 11 0M14 13l3 4M34 13l-3 4"/>'),
    abstracto: svg('<circle cx="19" cy="21" r="11"/><path d="M24 40l13-22 9 22z"/>'),
    nose: svg('<path d="M18 18a6 6 0 1 1 8.5 5.5c-1.5.7-2.5 2-2.5 3.6V29"/><circle cx="24" cy="35" r="1" fill="currentColor"/><circle cx="24" cy="24" r="18" stroke-dasharray="3 4"/>'),
    caja: svg('<path d="M24 8l15 7v18l-15 7-15-7V15z"/><path d="M9 15l15 7 15-7M24 22v18"/>'),
    bolsa: svg('<path d="M14 8h20l2 6v22c0 2-1 4-4 4H16c-3 0-4-2-4-4V14z"/><path d="M13 14h22M17 18h14"/>'),
    frasco: svg('<rect x="15" y="7" width="18" height="6" rx="2"/><path d="M14 13h20v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z"/><path d="M14 22h20M14 32h20"/>'),
    lata: svg('<ellipse cx="24" cy="11" rx="11" ry="4"/><path d="M13 11v26c0 2.2 4.9 4 11 4s11-1.8 11-4V11"/><path d="M13 19c0 2.2 4.9 4 11 4s11-1.8 11-4"/>'),
    botella: svg('<path d="M21 5h6v8l3 5v20a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V18l3-5z"/><path d="M18 24h12v10H18z"/>'),
    sachet: svg('<path d="M13 12l2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3v27H13z"/><path d="M18 22h12M18 27h8"/>'),
    tubo: svg('<path d="M14 8h20l-3 26H17z"/><rect x="20" y="34" width="8" height="6" rx="1.5"/><path d="M14 12h20"/>'),
    etiqueta: svg('<path d="M10 14h22l8 10-8 10H10z"/><circle cx="31" cy="24" r="2"/><path d="M15 21h10M15 27h7"/>'),
    ilustrado: svg('<path d="M10 38c6-2 9-8 10-15 1-6 5-12 12-14-1 7-3 12-8 16-3 2-7 3-10 3"/><path d="M14 30c4-3 8-6 11-10"/>'),
    fotografico: svg('<rect x="7" y="11" width="34" height="27" rx="4"/><circle cx="18" cy="21" r="3"/><path d="M8 34l10-9 8 7 5-4 9 7"/>'),
    minimal: svg('<rect x="9" y="9" width="30" height="30" rx="3"/><circle cx="24" cy="30" r="2" fill="currentColor"/>'),
    patron: svg('<circle cx="12" cy="12" r="3"/><circle cx="24" cy="12" r="3"/><circle cx="36" cy="12" r="3"/><circle cx="12" cy="24" r="3"/><circle cx="24" cy="24" r="3" fill="currentColor"/><circle cx="36" cy="24" r="3"/><circle cx="12" cy="36" r="3"/><circle cx="24" cy="36" r="3"/><circle cx="36" cy="36" r="3"/>'),
    artesanal: svg('<circle cx="24" cy="24" r="16" stroke-dasharray="2 3"/><circle cx="24" cy="24" r="11"/><path d="M19 24l3.5 3.5L29 21"/>'),
  };

  // ---------- Preguntas ----------
  const NOSE_TXT = ['No sé / aún no lo tengo', 'Not sure / don’t have it yet'];
  const o = (v, es, en, extra = {}) => ({ v, t: [es, en], ...extra });
  const BUDGET = [o('lt500', 'Menos de 500 USD', 'Under 500 USD'), o('500', '500–1.500 USD', '500–1,500 USD'), o('1500', '1.500–3.000 USD', '1,500–3,000 USD'),
    o('3000', 'Más de 3.000 USD', 'Over 3,000 USD'), o('hablar', 'Prefiero conversarlo', 'I’d rather talk about it')];

  const BRANDING = [
    { sec: ['Tu negocio', 'Your business'], qs: [
      { id: 'b_nombre', kind: 'text', q: ['¿Cómo se llama tu marca?', 'What is your brand called?'], help: ['Si aún no tiene nombre, escribe tus ideas.', 'If it doesn’t have a name yet, write your ideas.'], unknown: ['Aún no tiene nombre', 'No name yet'], ph: ['Ej.: Café Toro', 'E.g. Café Toro'] },
      { id: 'b_que', kind: 'textarea', q: ['¿Qué haces o qué vendes?', 'What do you do or sell?'], help: ['Cuéntalo como se lo explicarías a un amigo.', 'Explain it like you would to a friend.'], ph: ['Ej.: Hago galletas al estilo Nueva York y las vendo por Instagram y en ferias.', 'E.g. I bake New York–style cookies and sell them on Instagram and at markets.'] },
      { id: 'b_momento', kind: 'single', q: ['¿En qué momento está tu negocio?', 'Where is your business right now?'], opts: [
        o('idea', 'Es una idea', 'It’s an idea'), o('lanzar', 'Estoy por lanzar', 'About to launch'), o('funciona', 'Ya funciona y quiero una marca', 'It’s running and I want a brand'), o('renovar', 'Ya tengo marca y quiero renovarla', 'I have a brand and want to refresh it')] },
    ] },
    { sec: ['Tu negocio', 'Your business'], qs: [
      { id: 'b_donde', kind: 'multi', q: ['¿Dónde vendes o venderás?', 'Where do or will you sell?'], help: ['Elige todas las que apliquen.', 'Pick all that apply.'], opts: [
        o('fisica', 'Tienda física', 'Physical store'), o('online', 'Online', 'Online'), o('redes', 'Redes sociales', 'Social media'), o('super', 'Supermercados', 'Supermarkets'),
        o('ferias', 'Ferias o mercados', 'Fairs or markets'), o('b2b', 'A otras empresas', 'To other businesses'), o('export', 'Exportación', 'Export')] },
      { id: 'b_ciudad', kind: 'text', q: ['¿En qué ciudad o país?', 'In which city or country?'], ph: ['Ej.: Ciudad de Panamá', 'E.g. Panama City'] },
    ] },
    { sec: ['Tu cliente', 'Your customer'], qs: [
      { id: 'b_cliente', kind: 'textarea', q: ['¿Quién te compra o quién quieres que te compre?', 'Who buys from you, or who do you want to buy from you?'], help: ['Describe a una persona real: qué hace, qué le gusta, qué le preocupa.', 'Describe a real person: what they do, what they like, what worries them.'] },
      { id: 'b_edad', kind: 'multi', q: ['Edad aproximada', 'Approximate age'], opts: [
        o('ninos', 'Niños', 'Kids'), o('13', '13–17', '13–17'), o('18', '18–24', '18–24'), o('25', '25–34', '25–34'), o('35', '35–49', '35–49'), o('50', '50–64', '50–64'), o('65', '65+', '65+')] },
      { id: 'b_problema', kind: 'textarea', q: ['¿Qué problema le resuelves o qué deseo le cumples?', 'What problem do you solve, or what wish do you fulfill?'] },
      { id: 'b_porque', kind: 'textarea', q: ['¿Por qué te elegiría a ti y no a otro?', 'Why would they choose you over someone else?'] },
    ] },
    { sec: ['Competencia y referencias', 'Competition and references'], qs: [
      { id: 'b_compe', kind: 'textarea', q: ['¿Quiénes son tu competencia?', 'Who are your competitors?'], help: ['Nombres de marcas o negocios, aunque sean pequeños.', 'Names of brands or businesses, even small ones.'] },
      { id: 'b_admiras', kind: 'textarea', q: ['Marcas que admiras, de cualquier rubro, y por qué', 'Brands you admire, from any industry, and why'], help: ['Puedes pegar enlaces.', 'You can paste links.'] },
      { id: 'b_noparecer', kind: 'textarea', q: ['¿A qué no te quieres parecer?', 'What do you not want to look like?'] },
    ] },
    { sec: ['Personalidad', 'Personality'], qs: [
      { id: 'b_escalas', kind: 'scale', q: ['Si tu marca fuera una persona, ¿cómo sería?', 'If your brand were a person, what would it be like?'], help: ['Ubícala del 1 al 5 en cada par. El centro es "ni una ni otra".', 'Place it from 1 to 5 on each pair. The middle means "neither".'], pairs: [
        [['Clásica', 'Classic'], ['Moderna', 'Modern']], [['Seria', 'Serious'], ['Divertida', 'Fun']], [['Accesible', 'Accessible'], ['Premium', 'Premium']],
        [['Sobria', 'Understated'], ['Expresiva', 'Expressive']], [['Artesanal', 'Handmade'], ['Tecnológica', 'Tech']], [['Local', 'Local'], ['Global', 'Global']]] },
      { id: 'b_palabras', kind: 'words', q: ['Tres palabras que describan cómo quieres que te vean', 'Three words for how you want to be seen'], ph: [['Ej.: cercana', 'E.g. warm'], ['Ej.: atrevida', 'E.g. bold'], ['Ej.: confiable', 'E.g. reliable']] },
    ] },
    { sec: ['El logo', 'The logo'], qs: [
      { id: 'b_logo', kind: 'cards', max: 2, unknown: false, q: ['¿Qué tipo de logo te imaginas?', 'What kind of logo do you imagine?'], help: ['Elige hasta dos.', 'Pick up to two.'], opts: [
        o('tipografico', 'Tipográfico', 'Wordmark', { d: ['Solo el nombre, escrito con una letra propia.', 'Just the name, in its own lettering.'], ex: ['Como Google o Coca-Cola', 'Like Google or Coca-Cola'], icon: 'tipografico' }),
        o('monograma', 'Monograma', 'Monogram', { d: ['Las iniciales como signo; útil si el nombre es largo.', 'The initials as a sign; useful for long names.'], ex: ['Como LV o HP', 'Like LV or HP'], icon: 'monograma' }),
        o('logosimbolo', 'Logosímbolo', 'Combination mark', { d: ['Símbolo y nombre juntos; el más versátil.', 'Symbol and name together; the most versatile.'], ex: ['Como Spotify o Airbnb', 'Like Spotify or Airbnb'], icon: 'logosimbolo' }),
        o('isotipo', 'Isotipo', 'Symbol', { d: ['Solo el símbolo, para marcas ya reconocidas.', 'Just the symbol, for well-known brands.'], ex: ['Como la manzana de Apple', 'Like Apple’s apple'], icon: 'isotipo' }),
        o('emblema', 'Emblema o sello', 'Emblem or badge', { d: ['El nombre dentro de una forma; tradicional y artesanal.', 'The name inside a shape; traditional and crafted.'], ex: ['Como Starbucks o Harley-Davidson', 'Like Starbucks or Harley-Davidson'], icon: 'emblema' }),
        o('mascota', 'Mascota', 'Mascot', { d: ['Un personaje cercano, ideal para niños y comunidad.', 'A friendly character, great for kids and community.'], ex: ['Como KFC o Duolingo', 'Like KFC or Duolingo'], icon: 'mascota' }),
        o('abstracto', 'Símbolo abstracto', 'Abstract mark', { d: ['Una forma geométrica que no representa nada literal.', 'A geometric shape that isn’t literal.'], ex: ['Como Pepsi o Mastercard', 'Like Pepsi or Mastercard'], icon: 'abstracto' }),
        o('nose', 'No sé, recomiéndenme', 'Not sure, recommend one', { d: ['Lo definimos juntos con la estrategia.', 'We’ll define it together with the strategy.'], icon: 'nose', none: true })] },
    ] },
    { sec: ['Alcance', 'Scope'], qs: [
      { id: 'b_necesitas', kind: 'multi', unknown: false, q: ['¿Qué necesitas que diseñemos?', 'What do you need us to design?'], help: ['Elige todas las que apliquen.', 'Pick all that apply.'], opts: [
        o('logo', 'Logo', 'Logo'), o('paleta', 'Paleta de color', 'Color palette'), o('tipos', 'Tipografías', 'Typefaces'), o('manual', 'Manual de marca', 'Brand guidelines'),
        o('papeleria', 'Papelería', 'Stationery'), o('redes', 'Plantillas para redes', 'Social media templates'), o('web', 'Página web', 'Website'), o('empaque', 'Empaque', 'Packaging'),
        o('local', 'Señalética o local', 'Signage or store'), o('uniformes', 'Uniformes', 'Uniforms'), o('nose', 'Aún no lo sé', 'Not sure yet', { none: true })] },
      { id: 'b_cuando', kind: 'text', q: ['¿Para cuándo lo necesitas?', 'When do you need it?'], help: ['Una fecha o un evento: inauguración, feria, lanzamiento.', 'A date or an event: opening, fair, launch.'], ph: ['Ej.: para la feria de marzo', 'E.g. for the March fair'] },
      { id: 'b_presupuesto', kind: 'single', unknown: false, q: ['Presupuesto aproximado', 'Approximate budget'], opts: BUDGET },
    ] },
    { sec: ['Alcance', 'Scope'], qs: [
      { id: 'b_aprueba', kind: 'text', q: ['¿Quién aprueba el diseño final?', 'Who approves the final design?'], ph: ['Ej.: yo y mi socia', 'E.g. me and my partner'] },
      { id: 'b_mas', kind: 'textarea', unknown: false, q: ['¿Algo más que debamos saber?', 'Anything else we should know?'] },
    ] },
  ];

  const EMPAQUE = [
    { sec: ['El producto', 'The product'], qs: [
      { id: 'e_nombre', kind: 'text', q: ['Marca y nombre del producto', 'Brand and product name'], ph: ['Ej.: Mansa Galleta — Galleta de pistacho', 'E.g. Mansa Galleta — Pistachio cookie'] },
      { id: 'e_que', kind: 'textarea', q: ['¿Qué es el producto y qué lo hace especial?', 'What is the product and what makes it special?'] },
      { id: 'e_variedades', kind: 'text', q: ['¿Cuántas variedades, sabores o tamaños tendrá?', 'How many varieties, flavors or sizes will it have?'], ph: ['Ej.: 3 sabores en 250 g y 500 g', 'E.g. 3 flavors in 250 g and 500 g'] },
    ] },
    { sec: ['El producto', 'The product'], qs: [
      { id: 'e_precio', kind: 'text', q: ['Precio de venta aproximado', 'Approximate retail price'], ph: ['Ej.: 4.50 USD', 'E.g. 4.50 USD'] },
      { id: 'e_donde', kind: 'multi', q: ['¿Dónde se va a vender?', 'Where will it be sold?'], help: ['Elige todas las que apliquen.', 'Pick all that apply.'], opts: [
        o('super', 'Supermercado', 'Supermarket'), o('especializada', 'Tienda especializada', 'Specialty store'), o('farmacia', 'Farmacia', 'Pharmacy'), o('online', 'Online', 'Online'),
        o('ferias', 'Ferias o mercados', 'Fairs or markets'), o('horeca', 'Hoteles y restaurantes', 'Hotels and restaurants'), o('export', 'Exportación', 'Export')] },
    ] },
    { sec: ['Forma y material', 'Shape and material'], qs: [
      { id: 'e_envase', kind: 'cards', max: 3, unknown: false, q: ['¿Qué tipo de envase imaginas?', 'What kind of container do you imagine?'], help: ['Elige hasta tres.', 'Pick up to three.'], opts: [
        o('caja', 'Caja plegadiza', 'Folding box', { d: ['Cartón impreso.', 'Printed carton.'], ex: ['Cereales, cosmética, regalos', 'Cereal, cosmetics, gifts'], icon: 'caja' }),
        o('bolsa', 'Bolsa stand-up', 'Stand-up pouch', { d: ['Bolsa que se para sola, con zipper.', 'A pouch that stands, with a zipper.'], ex: ['Café, snacks, granos', 'Coffee, snacks, grains'], icon: 'bolsa' }),
        o('frasco', 'Frasco de vidrio', 'Glass jar', { d: ['Con tapa.', 'With a lid.'], ex: ['Mermeladas, salsas, cremas', 'Jams, sauces, creams'], icon: 'frasco' }),
        o('lata', 'Lata', 'Can', { d: ['Metal.', 'Metal.'], ex: ['Bebidas, conservas, té', 'Drinks, preserves, tea'], icon: 'lata' }),
        o('botella', 'Botella', 'Bottle', { d: ['Vidrio o plástico.', 'Glass or plastic.'], ex: ['Bebidas, aceites, cuidado personal', 'Drinks, oils, personal care'], icon: 'botella' }),
        o('sachet', 'Sachet o sobre', 'Sachet', { d: ['Porciones individuales.', 'Single portions.'], ex: ['Monodosis, muestras, condimentos', 'Single doses, samples, condiments'], icon: 'sachet' }),
        o('tubo', 'Tubo', 'Tube', { d: ['Se aprieta para servir.', 'Squeeze to dispense.'], ex: ['Cremas, pastas, cosmética', 'Creams, pastes, cosmetics'], icon: 'tubo' }),
        o('etiqueta', 'Solo etiqueta', 'Label only', { d: ['Para un envase que ya tienes.', 'For a container you already have.'], icon: 'etiqueta' }),
        o('nose', 'No sé todavía', 'Not sure yet', { d: ['Lo vemos juntos según el producto.', 'We’ll decide together based on the product.'], icon: 'nose', none: true })] },
      { id: 'e_material', kind: 'multi', unknown: false, q: ['Materiales que te gustan', 'Materials you like'], opts: [
        o('kraft', 'Cartón kraft', 'Kraft board'), o('cartulina', 'Cartulina blanca', 'White board'), o('vidrio', 'Vidrio', 'Glass'), o('metal', 'Metal', 'Metal'),
        o('reciclable', 'Plástico reciclable', 'Recyclable plastic'), o('compostable', 'Compostable', 'Compostable'), o('igual', 'Me da igual', 'No preference', { none: true })] },
      { id: 'e_proveedor', kind: 'text', q: ['¿Ya tienes un envase o proveedor?', 'Do you already have a container or supplier?'], help: ['Si es así, medidas o nombre del proveedor.', 'If so, sizes or the supplier’s name.'], unknown: ['Todavía no', 'Not yet'] },
    ] },
    { sec: ['Cómo se ve', 'How it looks'], qs: [
      { id: 'e_estilo', kind: 'cards', max: 2, q: ['¿Qué estilo de gráfica te gusta para el empaque?', 'What graphic style do you like for the packaging?'], help: ['Elige hasta dos.', 'Pick up to two.'], opts: [
        o('tipografico', 'Tipográfico', 'Typographic', { d: ['La letra es la protagonista.', 'Lettering takes the lead.'], icon: 'tipografico' }),
        o('ilustrado', 'Ilustrado', 'Illustrated', { d: ['Dibujos propios que cuentan algo.', 'Custom drawings that tell a story.'], icon: 'ilustrado' }),
        o('fotografico', 'Fotográfico', 'Photographic', { d: ['Una foto apetitosa o real del producto.', 'A tempting, real photo of the product.'], icon: 'fotografico' }),
        o('minimal', 'Minimal', 'Minimal', { d: ['Mucho blanco y un solo detalle.', 'Lots of white and one detail.'], icon: 'minimal' }),
        o('patron', 'Patrón o textura', 'Pattern or texture', { d: ['Un estampado que se reconoce de lejos.', 'A pattern you recognize from afar.'], icon: 'patron' }),
        o('artesanal', 'Artesanal', 'Handcrafted', { d: ['Kraft, sellos y detalles hechos a mano.', 'Kraft, stamps and handmade details.'], icon: 'artesanal' })] },
      { id: 'e_acabados', kind: 'multi', unknown: false, q: ['Acabados especiales', 'Special finishes'], help: ['El acabado es el toque final del impreso: brillo, relieve, metalizado…', 'A finish is the final touch on print: gloss, embossing, foil…'], opts: [
        o('mate', 'Mate', 'Matte'), o('brillo', 'Brillo', 'Gloss'), o('uv', 'Barniz en partes', 'Spot varnish'), o('foil', 'Dorado o plateado', 'Gold or silver foil'), o('relieve', 'Relieve', 'Embossing'),
        o('ventana', 'Ventana para ver el producto', 'Window to see the product'), o('soft', 'Tacto suave', 'Soft touch'), o('sencillo', 'Lo más sencillo posible', 'As simple as possible', { none: true })] },
      { id: 'e_variedad', kind: 'single', unknown: false, q: ['¿Cómo distinguimos cada variedad?', 'How do we tell each variety apart?'], opts: [
        o('color', 'Un color por variedad', 'A color per variety'), o('ilustracion', 'Una ilustración por variedad', 'An illustration per variety'),
        o('texto', 'Mismo diseño, cambia el texto', 'Same design, only the text changes'), o('nose', 'No sé, propónganme', 'Not sure, suggest something')] },
    ] },
    { sec: ['El frente del empaque', 'The front of the pack'], qs: [
      { id: 'e_orden', kind: 'rank', q: ['¿Qué debe verse primero?', 'What should be seen first?'], help: ['Ordena de más a menos importante con las flechas.', 'Order from most to least important with the arrows.'], items: [
        o('marca', 'La marca', 'The brand'), o('producto', 'El nombre del producto', 'The product name'), o('sabor', 'El sabor o la variedad', 'The flavor or variety'),
        o('beneficio', 'El beneficio principal', 'The main benefit'), o('imagen', 'Una imagen del producto', 'A product image'), o('precio', 'El precio o la oferta', 'The price or offer')] },
      { id: 'e_obligatoria', kind: 'multi', unknown: false, q: ['¿Qué información obligatoria lleva?', 'What mandatory information does it carry?'], opts: [
        o('registro', 'Registro sanitario', 'Health registration'), o('nutricional', 'Tabla nutricional', 'Nutrition facts'), o('ingredientes', 'Ingredientes', 'Ingredients'),
        o('barras', 'Código de barras', 'Barcode'), o('advertencia', 'Sellos de advertencia', 'Warning labels'), o('vencimiento', 'Fecha de vencimiento', 'Expiry date'),
        o('uso', 'Instrucciones de uso', 'Instructions for use'), o('nose', 'No estoy seguro', 'I’m not sure', { none: true })] },
      { id: 'e_frase', kind: 'text', q: ['Una frase que quieras que lleve el empaque', 'A phrase you want on the packaging'], ph: ['Ej.: Manso sabor, mansa actitud', 'E.g. Mighty flavor, mighty attitude'] },
    ] },
    { sec: ['Producción', 'Production'], qs: [
      { id: 'e_unidades', kind: 'single', unknown: false, q: ['¿Cuántas unidades imprimirás al inicio?', 'How many units will you print at first?'], opts: [
        o('lt500', 'Menos de 500', 'Under 500'), o('500', '500–2.000', '500–2,000'), o('2000', '2.000–10.000', '2,000–10,000'), o('10000', 'Más de 10.000', 'Over 10,000'), o('nose', 'No lo sé', 'Not sure')] },
      { id: 'e_salida', kind: 'text', q: ['¿Cuándo sale al mercado?', 'When does it hit the market?'] },
      { id: 'e_refs', kind: 'textarea', q: ['Empaques que te gustan o que no te gustan', 'Packaging you like or dislike'], help: ['Enlaces o descripción.', 'Links or a description.'] },
      { id: 'e_presupuesto', kind: 'single', unknown: false, q: ['Presupuesto de diseño aproximado', 'Approximate design budget'], opts: BUDGET },
    ] },
  ];

  // Respuestas "no sé" dentro de las opciones
  const NOSE_OPTS = new Set(['nose', 'hablar']);

  // ---------- Estado ----------
  const blank = () => ({ type: null, step: 0, a: {}, contact: {}, touched: {} });
  let S = blank();
  try { S = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

  const steps = () => {
    const list = [{ kind: 'intro' }];
    const add = (set, brief) => set.forEach((s, i) => list.push({ kind: 'q', brief, sec: s.sec, qs: s.qs, part: set.filter((x) => x.sec[0] === s.sec[0]).length > 1 ? set.filter((x, j) => j <= i && x.sec[0] === s.sec[0]).length : 0 }));
    if (S.type === 'branding' || S.type === 'ambos') add(BRANDING, 'branding');
    if (S.type === 'empaque' || S.type === 'ambos') add(EMPAQUE, 'empaque');
    if (S.type) list.push({ kind: 'contact' }, { kind: 'review' });
    return list;
  };
  const BRIEF_NAME = { branding: ['Brief de branding', 'Branding brief'], empaque: ['Brief de empaque', 'Packaging brief'] };

  // ---------- Lectura de respuestas ----------
  const opt = (q, v) => (q.opts || q.items).find((x) => x.v === v);
  const isEmpty = (q) => {
    const v = S.a[q.id];
    if (v === NOSE) return true;
    if (q.kind === 'scale') return !v || !Object.keys(v).length;
    if (q.kind === 'words') return !v || !v.some((w) => w && w.trim());
    if (q.kind === 'rank') return !S.touched[q.id];
    if (Array.isArray(v)) return !v.length || v.every((x) => NOSE_OPTS.has(x));
    if (q.kind === 'single') return !v || NOSE_OPTS.has(v);
    return !v || !String(v).trim();
  };
  const answerText = (q) => {
    const v = S.a[q.id];
    if (v === NOSE) return tx(q.unknown || NOSE_TXT);
    if (q.kind === 'scale') {
      if (!v || !Object.keys(v).length) return null;
      return q.pairs.map((p, i) => {
        const n = v[i];
        if (!n) return `${tx(p[0])}–${tx(p[1])}: ${tx(['sin responder', 'no answer'])}`;
        const word = n === 3 ? tx(['equilibrio', 'balanced']) : (n < 3 ? tx(p[0]) : tx(p[1])).toLowerCase();
        const strong = n === 1 || n === 5 ? tx(['muy ', 'very ']) : '';
        return `${tx(p[0])}–${tx(p[1])}: ${n === 3 ? word : strong + word}`;
      }).join('\n');
    }
    if (q.kind === 'words') return v && v.some((w) => w && w.trim()) ? v.filter((w) => w && w.trim()).map((w) => w.trim()).join(', ') : null;
    if (q.kind === 'rank') return S.touched[q.id] ? (v || q.items.map((x) => x.v)).map((k, i) => `${i + 1}. ${tx(opt(q, k).t)}`).join('\n') : null;
    if (Array.isArray(v)) return v.length ? v.map((k) => tx(opt(q, k).t)).join(', ') : null;
    if (q.kind === 'single') return v ? tx(opt(q, v).t) : null;
    return v && String(v).trim() ? String(v).trim() : null;
  };

  // ---------- Resumen ----------
  const MEETING = [
    ['b_nombre', ['¿El nombre será parte del proyecto o ya tienes candidatos que quieras evaluar?', 'Will naming be part of the project, or do you have candidates to evaluate?']],
    ['b_cliente', ['¿Quién es la persona que más te compra hoy, o te compraría, y dónde la encuentras?', 'Who buys from you most today (or would), and where do you find them?']],
    ['b_porque', ['¿Qué dicen tus clientes cuando te recomiendan?', 'What do your customers say when they recommend you?']],
    ['b_logo', ['¿Qué te gustaría que la gente sienta al ver tu logo por primera vez?', 'What should people feel the first time they see your logo?']],
    ['b_compe', ['¿Qué marcas aparecen junto a la tuya cuando un cliente compara opciones?', 'Which brands show up next to yours when a customer compares options?']],
    ['e_envase', ['¿Cómo se usa el producto en casa y cuánto dura abierto? Eso ayuda a elegir el envase.', 'How is the product used at home and how long does it last once opened? That helps choose the container.']],
    ['e_obligatoria', ['¿Ya tienes el registro sanitario y la tabla nutricional, o están en trámite?', 'Do you already have the health registration and nutrition facts, or are they in progress?']],
    ['e_proveedor', ['¿Ya cotizaste con alguna imprenta o proveedor de envases?', 'Have you already got quotes from a printer or packaging supplier?']],
    ['e_unidades', ['¿Cuántas unidades esperas vender en los primeros tres meses?', 'How many units do you expect to sell in the first three months?']],
    ['b_cuando', ['¿Hay una fecha o un evento que marque el lanzamiento?', 'Is there a date or event that marks the launch?']],
    ['e_salida', ['¿Hay una fecha o un evento que marque el lanzamiento?', 'Is there a date or event that marks the launch?']],
    ['b_presupuesto', ['¿Qué es imprescindible para el lanzamiento y qué puede esperar a una segunda etapa?', 'What is essential for launch and what can wait for a second phase?']],
    ['e_presupuesto', ['¿Qué es imprescindible para el lanzamiento y qué puede esperar a una segunda etapa?', 'What is essential for launch and what can wait for a second phase?']],
  ];
  const FALLBACK = [
    ['¿Qué tendría que pasar en un año para que digas que la marca funcionó?', 'What would need to happen in a year for you to say the brand worked?'],
    ['¿Quién más participará en las decisiones y cómo prefieres ver los avances?', 'Who else will take part in decisions, and how do you prefer to see progress?'],
    ['¿Qué es lo que más te preocupa de este proyecto?', 'What worries you most about this project?'],
  ];
  const allQs = () => steps().filter((s) => s.kind === 'q').flatMap((s) => s.qs);

  const summary = () => {
    let out = '';
    let lastBrief = null, lastSec = null;
    steps().filter((s) => s.kind === 'q').forEach((s) => {
      if (s.brief !== lastBrief) { out += `${out ? '\n' : ''}${tx(BRIEF_NAME[s.brief]).toUpperCase()}\n`; lastBrief = s.brief; lastSec = null; }
      if (tx(s.sec) !== lastSec) { out += `— ${tx(s.sec).toUpperCase()} —\n`; lastSec = tx(s.sec); }
      s.qs.forEach((q) => {
        const a = answerText(q) ?? tx(['sin responder', 'no answer']);
        out += `${tx(q.q)}\n${a.split('\n').map((l) => `  ${l}`).join('\n')}\n`;
      });
    });
    const gaps = allQs().filter(isEmpty);
    out += `\n${tx(['LO QUE QUEDÓ SIN DEFINIR', 'STILL TO BE DEFINED'])}\n`;
    out += gaps.length ? gaps.map((q) => `- ${tx(q.q)}`).join('\n') : `- ${tx(['Nada: el brief está completo.', 'Nothing: the brief is complete.'])}`;
    const ids = new Set(gaps.map((q) => q.id));
    const qs = [];
    MEETING.forEach(([id, text]) => { if (ids.has(id) && qs.length < 3 && !qs.includes(tx(text))) qs.push(tx(text)); });
    FALLBACK.forEach((text) => { if (qs.length < 3) qs.push(tx(text)); });
    out += `\n\n${tx(['TRES PREGUNTAS PARA LA PRIMERA REUNIÓN', 'THREE QUESTIONS FOR THE FIRST MEETING'])}\n${qs.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    return { text: out, gaps };
  };

  // ---------- Pintar ----------
  const unknownChip = (q) => (q.unknown === false ? '' :
    `<button type="button" class="bq-nose" data-nose="${q.id}" aria-pressed="${S.a[q.id] === NOSE}">${esc(tx(q.unknown || NOSE_TXT))}</button>`);

  const field = (q, n) => {
    const v = S.a[q.id];
    const off = v === NOSE;
    const id = `q-${q.id}`;
    const head = `<div class="bq-head"><span class="bq-n">${String(n).padStart(2, '0')}</span><div><h3 id="${id}-t">${esc(tx(q.q))}</h3>${q.help ? `<p class="bq-help" id="${id}-h">${esc(tx(q.help))}</p>` : ''}</div></div>`;
    const desc = q.help ? ` aria-describedby="${id}-h"` : '';
    let body = '';
    if (q.kind === 'text') body = `<input class="bq-input" id="${id}" data-q="${q.id}" aria-labelledby="${id}-t"${desc} value="${off ? '' : esc(v)}" placeholder="${esc(tx(q.ph || ['', '']))}" ${off ? 'disabled' : ''} autocomplete="off">`;
    if (q.kind === 'textarea') body = `<textarea class="bq-input" id="${id}" data-q="${q.id}" rows="3" aria-labelledby="${id}-t"${desc} placeholder="${esc(tx(q.ph || ['', '']))}" ${off ? 'disabled' : ''}>${off ? '' : esc(v)}</textarea>`;
    if (q.kind === 'words') body = `<div class="bq-words">${[0, 1, 2].map((i) => `<input class="bq-input" data-q="${q.id}" data-i="${i}" aria-label="${tx(['Palabra', 'Word'])} ${i + 1}" value="${off ? '' : esc((v || [])[i])}" placeholder="${esc(tx(q.ph[i]))}" ${off ? 'disabled' : ''} autocomplete="off">`).join('')}</div>`;
    if (q.kind === 'single' || q.kind === 'multi') {
      const multi = q.kind === 'multi';
      body = `<div class="bq-chips" role="group" aria-labelledby="${id}-t">${q.opts.map((x) => {
        const on = multi ? (Array.isArray(v) && v.includes(x.v)) : v === x.v;
        return `<label class="bq-chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${q.id}" value="${x.v}" data-q="${q.id}"${x.none ? ' data-none' : ''} ${on ? 'checked' : ''} ${off ? 'disabled' : ''}><span>${esc(tx(x.t))}</span></label>`;
      }).join('')}</div>`;
    }
    if (q.kind === 'cards') {
      body = `<div class="bq-cards" role="group" aria-labelledby="${id}-t">${q.opts.map((x) => {
        const on = Array.isArray(v) && v.includes(x.v);
        return `<label class="bq-card"><input type="checkbox" name="${q.id}" value="${x.v}" data-q="${q.id}" data-max="${q.max}"${x.none ? ' data-none' : ''} ${on ? 'checked' : ''} ${off ? 'disabled' : ''}>
          <span class="bq-card-in"><span class="bq-ico">${ICON[x.icon] || ''}</span><b>${esc(tx(x.t))}</b><span class="bq-d">${esc(tx(x.d))}</span>${x.ex ? `<span class="bq-ex">${esc(tx(x.ex))}</span>` : ''}</span></label>`;
      }).join('')}</div><p class="bq-limit" aria-live="polite"></p>`;
    }
    if (q.kind === 'scale') {
      body = `<div class="bq-scales">${q.pairs.map((p, i) => `<fieldset class="bq-scale"${off ? ' disabled' : ''}><legend class="sr-only">${esc(tx(p[0]))} – ${esc(tx(p[1]))}</legend>
        <span class="bq-end">${esc(tx(p[0]))}</span><span class="bq-dots">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="${q.id}-${i}" value="${n}" data-q="${q.id}" data-i="${i}" ${(v && v[i] === n) ? 'checked' : ''}><span aria-hidden="true"></span><span class="sr-only">${n}</span></label>`).join('')}</span><span class="bq-end">${esc(tx(p[1]))}</span></fieldset>`).join('')}</div>`;
    }
    if (q.kind === 'rank') body = `<ol class="bq-rank" data-q="${q.id}">${rankItems(q)}</ol><p class="sr-only" aria-live="polite" id="${id}-live"></p>
      <button type="button" class="bq-ok" data-rankok="${q.id}" aria-pressed="${!!S.touched[q.id]}">${esc(tx(['Este orden está bien', 'This order is right']))}</button>`;
    return `<div class="bq${off ? ' is-off' : ''}" data-block="${q.id}">${head}<div class="bq-body">${body}${unknownChip(q)}</div></div>`;
  };
  const rankItems = (q) => {
    const order = S.a[q.id] || q.items.map((x) => x.v);
    return order.map((k, i) => `<li><span class="bq-pos">${i + 1}</span><span class="bq-rt">${esc(tx(opt(q, k).t))}</span>
      <button type="button" class="bq-mv" data-move="${q.id}" data-k="${k}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="${esc(tx(['Subir', 'Move up']))}: ${esc(tx(opt(q, k).t))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M6 15l6-6 6 6"/></svg></button>
      <button type="button" class="bq-mv" data-move="${q.id}" data-k="${k}" data-d="1" ${i === order.length - 1 ? 'disabled' : ''} aria-label="${esc(tx(['Bajar', 'Move down']))}: ${esc(tx(opt(q, k).t))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg></button></li>`).join('');
  };

  const ARROW = '<svg aria-hidden="true"><use href="#arrow-r"/></svg>';
  const nav = (back, nextLabel, nextAttr = 'data-next') => `<div class="bq-nav">${back ? `<button type="button" class="btn btn-ghost" data-back>${esc(tx(['Atrás', 'Back']))}</button>` : '<span></span>'}
    <button type="button" class="btn btn-dark" ${nextAttr}>${esc(nextLabel)} ${ARROW}</button></div>`;

  const render = (focus = true) => {
    const list = steps();
    if (S.step >= list.length) S.step = list.length - 1;
    const st = list[S.step];
    const qSteps = list.filter((s) => s.kind === 'q');
    const qIndex = qSteps.indexOf(st);
    const total = list.length - 1;
    const pct = st.kind === 'intro' ? 0 : Math.round((S.step / total) * 100);
    let html = `<div class="bq-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>`;

    if (st.kind === 'intro') {
      const card = (v, t, d) => `<label class="bq-type"><input type="radio" name="brief-type" value="${v}" ${S.type === v ? 'checked' : ''}><span class="bq-type-in"><span class="bq-ico">${ICON[v]}</span><b>${esc(tx(t))}</b><span class="bq-d">${esc(tx(d))}</span></span></label>`;
      html += `<header class="bq-step-head"><p class="label">${esc(tx(['Brief de proyecto', 'Project brief']))}</p>
        <h2 class="bq-hero" tabindex="-1">${esc(tx(['Cuéntanos tu proyecto', 'Tell us about your project']))}</h2>
        <p class="bq-lead">${esc(tx(['Unas preguntas sencillas para entender tu marca. No hace falta tener todo claro: puedes responder “no sé” y lo definimos juntos.', 'A few simple questions to understand your brand. You don’t need to have it all figured out: you can answer “not sure” and we’ll define it together.']))}</p>
        <ul class="bq-facts"><li>${esc(tx(['10–15 minutos', '10–15 minutes']))}</li><li>${esc(tx(['Se guarda mientras avanzas', 'Saves as you go']))}</li><li>${esc(tx(['Te respondemos en 48 horas', 'We reply within 48 hours']))}</li></ul></header>
        <div class="bq"><div class="bq-head"><span class="bq-n">00</span><div><h2 id="q-type-t" class="bq-q">${esc(tx(['¿Qué necesitas?', 'What do you need?']))}</h2></div></div>
        <div class="bq-types" role="radiogroup" aria-labelledby="q-type-t">${card('branding', ['Branding', 'Branding'], ['Nombre, logo e identidad de tu marca.', 'Name, logo and identity for your brand.'])}${card('empaque', ['Empaque', 'Packaging'], ['El envase y la etiqueta de tu producto.', 'Your product’s container and label.'])}${card('ambos', ['Los dos', 'Both'], ['Marca y empaque, para que hablen el mismo idioma.', 'Brand and packaging, speaking the same language.'])}</div></div>
        <div class="bq-nav"><span></span><button type="button" class="btn btn-dark" data-next ${S.type ? '' : 'disabled'}>${esc(tx(['Empezar', 'Start']))} ${ARROW}</button></div>`;
    }
    if (st.kind === 'q') {
      const sameBrief = qSteps.filter((s) => s.brief === st.brief);
      const n0 = qSteps.slice(0, qIndex).reduce((a, s) => a + s.qs.length, 0);
      html += `<header class="bq-step-head"><p class="label">${esc(tx(BRIEF_NAME[st.brief]))} · ${sameBrief.indexOf(st) + 1} ${esc(tx(['de', 'of']))} ${sameBrief.length}</p>
        <h2 tabindex="-1">${esc(tx(st.sec))}${st.part ? ` <span class="bq-part">${st.part}/2</span>` : ''}</h2></header>
        ${st.qs.map((q, i) => field(q, n0 + i + 1)).join('')}
        ${nav(true, tx(['Siguiente', 'Next']))}`;
    }
    if (st.kind === 'contact') {
      const c = S.contact;
      html += `<header class="bq-step-head"><p class="label">${esc(tx(['Último paso', 'Last step']))}</p><h2 tabindex="-1">${esc(tx(['¿A dónde te escribimos?', 'Where should we reach you?']))}</h2>
        <p class="bq-lead">${esc(tx(['Déjanos un email o un WhatsApp. Solo los usamos para responderte sobre tu proyecto.', 'Leave an email or a WhatsApp number. We only use them to reply about your project.']))}</p></header>
        <div class="bq bq-contact">
          <label class="field"><span>${esc(tx(['Tu nombre', 'Your name']))}</span><input class="bq-input" data-c="nombre" autocomplete="name" value="${esc(c.nombre)}" required></label>
          <label class="field"><span>Email</span><input class="bq-input" type="email" data-c="email" autocomplete="email" spellcheck="false" value="${esc(c.email)}"></label>
          <label class="field"><span>WhatsApp</span><input class="bq-input" type="tel" data-c="whatsapp" autocomplete="tel" value="${esc(c.whatsapp)}"></label>
          <p class="bq-msg" role="status" aria-live="polite"></p>
        </div>
        ${nav(true, tx(['Ver mi resumen', 'See my summary']), 'data-tocheck')}`;
    }
    if (st.kind === 'review') {
      const { text, gaps } = summary();
      html += `<header class="bq-step-head"><p class="label">${esc(tx(['Resumen', 'Summary']))}</p><h2 tabindex="-1">${esc(tx(['Revisa tu brief', 'Review your brief']))}</h2>
        <p class="bq-lead">${esc(gaps.length ? tx([`Quedaron ${gaps.length} puntos sin definir. Está bien: los vemos juntos en la primera reunión.`, `${gaps.length} points are still open. That’s fine: we’ll go over them in the first meeting.`]) : tx(['Está completo. ¡Gracias por el detalle!', 'It’s complete. Thanks for the detail!']))}</p></header>
        <pre class="bq-summary" tabindex="0" aria-label="${esc(tx(['Resumen del brief', 'Brief summary']))}">${esc(text)}</pre>
        <div class="bq-tools"><button type="button" class="btn btn-ghost" data-copy>${esc(tx(['Copiar', 'Copy']))}</button><button type="button" class="btn btn-ghost" data-download>${esc(tx(['Descargar .txt', 'Download .txt']))}</button><button type="button" class="btn btn-ghost" data-edit>${esc(tx(['Editar respuestas', 'Edit answers']))}</button></div>
        <p class="bq-msg" role="status" aria-live="polite"></p>
        <p class="bq-legal">${esc(tx(['Solo usaremos estos datos para responderte sobre tu proyecto. Nada de publicidad ni listas de correo.', 'We only use this information to reply about your project. No advertising, no mailing lists.']))}</p>
        ${nav(true, tx(['Enviar a choque', 'Send to choque']), 'data-send')}`;
    }
    app.innerHTML = html;
    if (focus) { app.querySelector('h2')?.focus({ preventScroll: true }); scrollTo(0, 0); }
  };

  // ---------- Interacción ----------
  const qById = (id) => [...BRANDING, ...EMPAQUE].flatMap((s) => s.qs).find((q) => q.id === id);
  const go = (d) => { S.step = Math.max(0, S.step + d); save(); render(); };

  app.addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'brief-type') { S.type = el.value; save(); app.querySelector('[data-next]').disabled = false; return; }
    const id = el.dataset.q;
    if (!id) return;
    const q = qById(id);
    if (q.kind === 'single') S.a[id] = el.value;
    if (q.kind === 'scale') { S.a[id] = { ...(S.a[id] || {}), [el.dataset.i]: Number(el.value) }; }
    if (q.kind === 'multi' || q.kind === 'cards') {
      const group = [...app.querySelectorAll(`input[name="${id}"]`)];
      if (el.checked && el.hasAttribute('data-none')) group.forEach((x) => { if (x !== el) x.checked = false; });
      if (el.checked && !el.hasAttribute('data-none')) group.forEach((x) => { if (x.hasAttribute('data-none')) x.checked = false; });
      const max = Number(el.dataset.max || 0);
      const picked = group.filter((x) => x.checked);
      const limit = app.querySelector(`[data-block="${id}"] .bq-limit`);
      if (max && picked.length > max) {
        el.checked = false;
        if (limit) limit.textContent = tx([`Puedes elegir hasta ${max}. Quita una para cambiarla.`, `You can pick up to ${max}. Remove one to change it.`]);
      } else if (limit) limit.textContent = '';
      S.a[id] = group.filter((x) => x.checked).map((x) => x.value);
    }
    save();
  });
  app.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.c) { S.contact[el.dataset.c] = el.value; el.removeAttribute('aria-invalid'); save(); return; }
    const id = el.dataset.q;
    if (!id) return;
    const q = qById(id);
    if (q.kind === 'text' || q.kind === 'textarea') S.a[id] = el.value;
    if (q.kind === 'words') { const w = Array.isArray(S.a[id]) ? S.a[id] : ['', '', '']; w[Number(el.dataset.i)] = el.value; S.a[id] = w; }
    save();
  });
  app.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-next')) return go(1);
    if (b.hasAttribute('data-back')) return go(-1);
    if (b.dataset.nose) {
      const id = b.dataset.nose, on = S.a[id] !== NOSE;
      S.a[id] = on ? NOSE : undefined; save();
      const block = app.querySelector(`[data-block="${id}"]`);
      block.classList.toggle('is-off', on);
      b.setAttribute('aria-pressed', String(on));
      block.querySelectorAll('input, textarea, fieldset').forEach((x) => { x.disabled = on; if (on && x.type !== 'radio' && x.type !== 'checkbox') x.value = ''; if (on && (x.type === 'radio' || x.type === 'checkbox')) x.checked = false; });
      return;
    }
    if (b.dataset.move) {
      const q = qById(b.dataset.move);
      const order = [...(S.a[q.id] || q.items.map((x) => x.v))];
      const i = order.indexOf(b.dataset.k), j = i + Number(b.dataset.d);
      [order[i], order[j]] = [order[j], order[i]];
      S.a[q.id] = order; S.touched[q.id] = true; save();
      const list = app.querySelector(`.bq-rank[data-q="${q.id}"]`);
      list.innerHTML = rankItems(q);
      app.querySelector(`[data-rankok="${q.id}"]`).setAttribute('aria-pressed', 'true');
      document.getElementById(`q-${q.id}-live`).textContent = `${tx(opt(q, b.dataset.k).t)}: ${tx(['posición', 'position'])} ${j + 1}`;
      const again = list.querySelector(`[data-k="${b.dataset.k}"][data-d="${b.dataset.d}"]:not([disabled])`) || list.querySelector(`[data-k="${b.dataset.k}"]:not([disabled])`);
      again?.focus();
      return;
    }
    if (b.dataset.rankok) { S.touched[b.dataset.rankok] = true; save(); b.setAttribute('aria-pressed', 'true'); return; }
    if (b.hasAttribute('data-tocheck')) {
      const c = S.contact, msg = app.querySelector('.bq-msg');
      const bad = (sel, text) => { const f = app.querySelector(sel); f.setAttribute('aria-invalid', 'true'); f.focus(); msg.textContent = text; msg.className = 'bq-msg err'; };
      if (!c.nombre?.trim()) return bad('[data-c="nombre"]', tx(['Escribe tu nombre.', 'Write your name.']));
      if (!c.email?.trim() && !c.whatsapp?.trim()) return bad('[data-c="email"]', tx(['Déjanos un email o un WhatsApp para responderte.', 'Leave an email or a WhatsApp number so we can reply.']));
      if (c.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) return bad('[data-c="email"]', tx(['Revisa el email, parece incompleto.', 'Check the email, it looks incomplete.']));
      return go(1);
    }
    if (b.hasAttribute('data-edit')) { S.step = 1; save(); return render(); }
    const msg = app.querySelector('.bq-msg');
    if (b.hasAttribute('data-copy')) {
      try { await navigator.clipboard.writeText(summary().text); msg.textContent = tx(['Resumen copiado.', 'Summary copied.']); } catch { msg.textContent = tx(['No se pudo copiar. Selecciona el texto y cópialo.', 'Couldn’t copy. Select the text and copy it.']); }
      return;
    }
    if (b.hasAttribute('data-download')) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([summary().text], { type: 'text/plain;charset=utf-8' }));
      a.download = `brief-choque-${(S.contact.nombre || 'proyecto').trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.txt`;
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    if (b.hasAttribute('data-send')) {
      const { text, gaps } = summary();
      const c = S.contact;
      const brandName = answerText(qById('b_nombre')) || answerText(qById('e_nombre')) || '';
      const body = new URLSearchParams({
        'form-name': 'brief-proyecto', 'bot-field': '',
        subject: `Brief ${S.type === 'ambos' ? 'branding + empaque' : S.type}: ${c.nombre.trim()}${brandName ? ` (${brandName})` : ''}`,
        nombre: c.nombre.trim(), email: (c.email || '').trim(), whatsapp: (c.whatsapp || '').trim(),
        tipo: S.type, resumen: text, sin_definir: String(gaps.length), idioma: lang, fuente: typeof SOURCE === 'string' ? SOURCE : '',
      });
      b.disabled = true; msg.textContent = tx(['Enviando…', 'Sending…']); msg.className = 'bq-msg';
      try {
        const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
        if (!r.ok) throw new Error(r.status);
        if (typeof count === 'function') count('brief');
        try { localStorage.removeItem(KEY); } catch {}
        S = blank(); // la próxima visita empieza de cero
        renderDone();
      } catch {
        msg.textContent = tx(['No se pudo enviar. Intenta de nuevo, o copia el resumen y mándalo por WhatsApp.', 'Couldn’t send it. Try again, or copy the summary and send it on WhatsApp.']);
        msg.className = 'bq-msg err'; b.disabled = false;
      }
    }
  });
  const renderDone = () => {
    app.innerHTML = `<div class="bq-done"><span class="bq-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      <h2 tabindex="-1">${esc(tx(['¡Recibimos tu brief!', 'We got your brief!']))}</h2><p class="bq-lead">${esc(tx(['Lo revisamos y te escribimos en menos de 48 horas para agendar la primera reunión.', 'We’ll review it and write to you within 48 hours to schedule the first meeting.']))}</p>
      <div class="bq-tools"><a class="btn btn-dark" href="https://wa.me/50764228672" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-ghost" href="../index.html">${esc(tx(['Volver al inicio', 'Back to home']))}</a></div></div>`;
    app.querySelector('h2').focus({ preventScroll: true });
    scrollTo(0, 0);
  };

  document.addEventListener('langchange', () => { if (!app.querySelector('.bq-done')) render(false); });
  render(false);
})();
