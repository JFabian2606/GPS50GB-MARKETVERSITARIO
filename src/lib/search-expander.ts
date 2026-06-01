/**
 * Utility for expanding search queries semantically (Query Expansion).
 * Supports both a local thesaurus dictionary fallback and dynamic Gemini API generation if configured.
 */

// Common Spanish stopwords to filter out before running local thesaurus expansion
const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 
  'y', 'o', 'e', 'en', 'para', 'por', 'con', 'sin', 'sobre', 'bajo', 'entre', 
  'hacia', 'hasta', 'desde', 'mi', 'tu', 'su', 'mis', 'tus', 'sus', 'me', 'te', 
  'se', 'nos', 'le', 'les', 'lo', 'que', 'como', 'con', 'es', 'son', 'esta', 'este',
  'busca', 'buscar', 'necesito', 'quiero', 'compro', 'vendo', 'tengo', 'solicito'
]);

// Local thesaurus for academic/university marketplace terms
// Keys and values should be normalized (lowercase, no accents)
const LOCAL_THESAURUS: Record<string, string[]> = {
  // Tecnología y Electrónica
  'computador': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'tecnologia', 'pantalla', 'cargador', 'mouse', 'teclado'],
  'computadora': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'tecnologia'],
  'laptop': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'tecnologia'],
  'portatil': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'tecnologia'],
  'pc': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'tecnologia'],
  'ordenador': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'tecnologia'],
  'macbook': ['computador', 'computadora', 'laptop', 'portatil', 'pc', 'ordenador', 'macbook', 'notebook', 'apple'],
  'celular': ['celular', 'movil', 'telefono', 'smartphone', 'iphone', 'android', 'cargador', 'dispositivo'],
  'movil': ['celular', 'movil', 'telefono', 'smartphone', 'iphone', 'android'],
  'telefono': ['celular', 'movil', 'telefono', 'smartphone', 'iphone', 'android'],
  'smartphone': ['celular', 'movil', 'telefono', 'smartphone', 'iphone', 'android'],
  'iphone': ['celular', 'movil', 'telefono', 'smartphone', 'iphone', 'apple'],
  'audifonos': ['audifonos', 'auriculares', 'cascos', 'diadema', 'airpods', 'sonido', 'musica'],
  'auriculares': ['audifonos', 'auriculares', 'cascos', 'diadema', 'airpods'],
  'cascos': ['audifonos', 'auriculares', 'cascos', 'diadema'],
  'pantalla': ['pantalla', 'monitor', 'tv', 'television', 'display', 'led'],
  'monitor': ['pantalla', 'monitor', 'tv', 'television', 'display'],
  'mouse': ['mouse', 'raton', 'teclado', 'periferico'],
  'teclado': ['teclado', 'mouse', 'periferico'],

  // Libros y Copias
  'libro': ['libro', 'texto', 'manual', 'lectura', 'fotocopia', 'copia', 'fotocopias', 'apuntes', 'guia', 'guias', 'tomo', 'estudio'],
  'libros': ['libro', 'texto', 'manual', 'lectura', 'fotocopia', 'copia', 'fotocopias', 'apuntes', 'guia', 'guias', 'tomo', 'estudio'],
  'texto': ['libro', 'texto', 'manual', 'lectura', 'guia', 'tomo'],
  'manual': ['libro', 'texto', 'manual', 'lectura', 'guia'],
  'copia': ['libro', 'texto', 'manual', 'fotocopia', 'copia', 'fotocopias', 'apuntes', 'guia'],
  'copias': ['libro', 'texto', 'manual', 'fotocopia', 'copia', 'fotocopias', 'apuntes', 'guia'],
  'fotocopia': ['libro', 'texto', 'manual', 'fotocopia', 'copia', 'fotocopias', 'apuntes', 'guia'],
  'fotocopias': ['libro', 'texto', 'manual', 'fotocopia', 'copia', 'fotocopias', 'apuntes', 'guia'],
  'apuntes': ['libro', 'texto', 'apuntes', 'cuaderno', 'libreta', 'resumen', 'clase', 'guia'],
  'resumen': ['apuntes', 'resumen', 'estudio', 'guia', 'clase'],

  // Útiles Universitarios
  'cuaderno': ['cuaderno', 'libreta', 'block', 'carpeta', 'hojas', 'utiles', 'lapicero', 'borrador'],
  'libreta': ['cuaderno', 'libreta', 'block', 'carpeta', 'hojas', 'utiles'],
  'block': ['cuaderno', 'libreta', 'block', 'utiles', 'hojas'],
  'calculadora': ['calculadora', 'cientifica', 'casio', 'texas', 'financiera', 'mates', 'calculo', 'algebra'],
  'cientifica': ['calculadora', 'cientifica', 'casio'],
  'casio': ['calculadora', 'cientifica', 'casio'],
  'utiles': ['cuaderno', 'libreta', 'lapicero', 'lapiz', 'borrador', 'regla', 'corrector'],
  'lapicero': ['lapicero', 'pluma', 'boligrafo', 'lapiz', 'utiles', 'tinta'],
  'lapiz': ['lapicero', 'pluma', 'boligrafo', 'lapiz', 'utiles'],
  'pluma': ['lapicero', 'pluma', 'boligrafo', 'lapiz', 'utiles'],
  'boligrafo': ['lapicero', 'pluma', 'boligrafo', 'lapiz', 'utiles'],

  // Ropa y Accesorios
  'bata': ['bata', 'laboratorio', 'uniforme', 'delantal', 'ropa', 'quimica', 'biologia', 'medicina'],
  'laboratorio': ['bata', 'laboratorio', 'uniforme', 'delantal', 'gafas'],
  'uniforme': ['bata', 'laboratorio', 'uniforme', 'delantal', 'ropa'],
  'maleta': ['maleta', 'mochila', 'morral', 'bolso', 'tula', 'maletin', 'utiles'],
  'mochila': ['maleta', 'mochila', 'morral', 'bolso', 'tula', 'maletin'],
  'morral': ['maleta', 'mochila', 'morral', 'bolso', 'tula', 'maletin'],
  'bolso': ['maleta', 'mochila', 'morral', 'bolso', 'tula', 'maletin'],

  // Tutorías y Asignaturas
  'tutoria': ['tutoria', 'tutorias', 'clase', 'clases', 'asesoria', 'apoyo', 'explicacion', 'refuerzo', 'ayuda', 'profesor', 'tutor', 'enseñanza', 'explicar'],
  'tutorias': ['tutoria', 'tutorias', 'clase', 'clases', 'asesoria', 'apoyo', 'explicacion', 'refuerzo', 'ayuda', 'profesor', 'tutor', 'enseñanza', 'explicar'],
  'clase': ['tutoria', 'tutorias', 'clase', 'clases', 'asesoria', 'apoyo', 'explicacion', 'refuerzo', 'tutor'],
  'clases': ['tutoria', 'tutorias', 'clase', 'clases', 'asesoria', 'apoyo', 'explicacion', 'refuerzo', 'tutor'],
  'asesoria': ['tutoria', 'tutorias', 'clase', 'asesoria', 'apoyo', 'explicacion', 'refuerzo', 'consultoria'],
  'ingles': ['ingles', 'english', 'idioma', 'lengua', 'traduccion', 'toefl', 'ielts', 'writing', 'speaking'],
  'english': ['ingles', 'english', 'idioma', 'lengua', 'traduccion'],
  'calculo': ['calculo', 'algebra', 'matematicas', 'mates', 'fisica', 'ciencias', 'tutoria'],
  'algebra': ['calculo', 'algebra', 'matematicas', 'mates', 'geometria'],
  'matematicas': ['calculo', 'algebra', 'matematicas', 'mates', 'geometria', 'estadistica'],
  'mates': ['calculo', 'algebra', 'matematicas', 'mates', 'geometria'],
  'fisica': ['fisica', 'calculo', 'matematicas', 'mates', 'quimica', 'ciencias'],
  'quimica': ['quimica', 'biologia', 'bata', 'laboratorio', 'ciencias'],
  'programacion': ['programacion', 'codigo', 'sistemas', 'computacion', 'desarrollo', 'web', 'python', 'java', 'javascript', 'react', 'node', 'db', 'base de datos'],
  'codigo': ['programacion', 'codigo', 'desarrollo', 'software'],
  'sistemas': ['programacion', 'codigo', 'sistemas', 'computacion', 'informatica'],

  // Modificadores de precio y estado
  'barato': ['barato', 'economico', 'descuento', 'rebaja', 'ganga', 'oferta', 'promocion', 'bajo precio', 'remate'],
  'economico': ['barato', 'economico', 'descuento', 'rebaja', 'ganga', 'oferta', 'promocion', 'bajo precio'],
  'ganga': ['barato', 'economico', 'descuento', 'rebaja', 'ganga', 'oferta', 'promocion'],
  'oferta': ['barato', 'economico', 'descuento', 'rebaja', 'ganga', 'oferta', 'promocion'],
  'caro': ['caro', 'costoso', 'premium', 'lujo', 'nuevo', 'excelente'],
  'costoso': ['caro', 'costoso', 'premium', 'lujo']
};

/**
 * Normalizes a word by converting to lowercase and removing Spanish accents/diacritics.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Removes accents
    .replace(/[^a-z0-9ñ]/g, '')     // Keeps letters, numbers and ñ
    .trim();
}

// Bidirectional mapping of common accented Spanish words in the academic domain
const ACCENT_MAP: Record<string, string> = {
  'portatil': 'portátil',
  'portátil': 'portatil',
  'telefono': 'teléfono',
  'teléfono': 'telefono',
  'audifonos': 'audífonos',
  'audífonos': 'audifonos',
  'television': 'televisión',
  'televisión': 'television',
  'tutoria': 'tutoría',
  'tutoría': 'tutoria',
  'tutorias': 'tutorías',
  'tutorías': 'tutorias',
  'calculo': 'cálculo',
  'cálculo': 'calculo',
  'fisica': 'física',
  'física': 'fisica',
  'quimica': 'química',
  'química': 'quimica',
  'matematicas': 'matemáticas',
  'matemáticas': 'matematicas',
  'codigo': 'código',
  'código': 'codigo',
  'programacion': 'programación',
  'programación': 'programacion',
  'computacion': 'computación',
  'computación': 'computacion',
  'ingles': 'inglés',
  'inglés': 'ingles',
  'geometria': 'geometría',
  'geometría': 'geometria',
  'estadistica': 'estadística',
  'estadística': 'estadistica',
  'economico': 'económico',
  'económico': 'economico',
  'promocion': 'promoción',
  'promoción': 'promocion',
  'utiles': 'útiles',
  'útiles': 'utiles',
  'lapiz': 'lápiz',
  'lápiz': 'lapiz',
  'boligrafo': 'bolígrafo',
  'bolígrafo': 'boligrafo',
  'categoria': 'categoría',
  'categoría': 'categoria'
};

/**
 * Ensures that both accented and unaccented versions of terms are present in the final list
 * to handle case-sensitive and accent-sensitive database collations.
 */
function applyAccentVariants(terms: string[]): string[] {
  const resultSet = new Set<string>();
  terms.forEach(t => {
    resultSet.add(t);
    
    // Add unaccented version
    const unaccented = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (unaccented !== t) {
      resultSet.add(unaccented);
    }

    // Add mapped variant from the dictionary
    const variant = ACCENT_MAP[t];
    if (variant) {
      resultSet.add(variant);
    }
  });
  return Array.from(resultSet);
}

/**
 * Perform query expansion using the local thesaurus dictionary.
 */
function expandLocally(query: string): string[] {
  const words = query
    .split(/\s+/)
    .map(w => normalizeWord(w))
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));

  const expandedSet = new Set<string>();

  // Always include the original keywords
  words.forEach(w => expandedSet.add(w));

  // Add synonyms from the thesaurus
  words.forEach(word => {
    if (LOCAL_THESAURUS[word]) {
      LOCAL_THESAURUS[word].forEach(syn => expandedSet.add(syn));
    }
  });

  // If set is empty, fallback to the original words
  if (expandedSet.size === 0) {
    return query.split(/\s+/).map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
  }

  return Array.from(expandedSet);
}

/**
 * Calls Gemini API to perform semantic query expansion.
 */
async function expandWithGemini(query: string, apiKey: string): Promise<string[] | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = 
    `Eres un asistente experto en búsqueda semántica para un mercado universitario en español ("MarketVersitario"). ` +
    `Tu tarea es tomar la consulta del usuario y expandirla generando una lista de palabras clave relacionadas: ` +
    `sinónimos, antónimos o conceptos relacionados directamente, variaciones y traducciones comunes (ej. "celular" -> "movil, telefono, smartphone", "barato" -> "economico, oferta, rebaja"). ` +
    `Genera únicamente un arreglo JSON de strings con las palabras expandidas en minúsculas y sin acentos. No incluyas bloques de código markdown, texto aclaratorio, ni nada que no sea el JSON puro.`;

  const prompt = `Consulta del usuario: "${query}"`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemInstruction}\n\n${prompt}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      console.warn(`Gemini API responded with status ${response.status}`);
      return null;
    }

    const json = await response.json();
    const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      console.warn('Empty response from Gemini API');
      return null;
    }

    // Clean markdown formatting if present
    let cleanedText = textResponse.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleanedText);
    if (Array.isArray(parsed)) {
      // Normalize result strings
      const result = parsed
        .map((w: any) => typeof w === 'string' ? normalizeWord(w) : '')
        .filter((w: string) => w.length > 1);
      
      // Ensure the original query tokens are present
      const queryTokens = query.split(/\s+/).map(normalizeWord).filter(w => w.length > 1 && !STOP_WORDS.has(w));
      queryTokens.forEach(t => {
        if (!result.includes(t)) {
          result.push(t);
        }
      });

      return result;
    }

    return null;
  } catch (error) {
    console.error('Error expanding query with Gemini:', error);
    return null;
  }
}

/**
 * Expands a user query into a list of related keywords.
 * Tries Gemini API first if GEMINI_API_KEY is defined, falls back to the local thesaurus.
 */
export async function expandQuery(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const apiKey = process.env.GEMINI_API_KEY;
  let expandedTerms: string[] = [];

  if (apiKey) {
    const aiResult = await expandWithGemini(trimmed, apiKey);
    if (aiResult && aiResult.length > 0) {
      console.log(`[Semantic Search] Query "${trimmed}" expanded using Gemini to:`, aiResult);
      expandedTerms = aiResult;
    }
  }

  if (expandedTerms.length === 0) {
    // Fallback or default to local thesaurus
    const localResult = expandLocally(trimmed);
    console.log(`[Semantic Search] Query "${trimmed}" expanded using Local Thesaurus to:`, localResult);
    expandedTerms = localResult;
  }

  // Ensure both accented and unaccented variants of all keywords are generated
  const finalResult = applyAccentVariants(expandedTerms);
  console.log(`[Semantic Search] Final terms with accent variants:`, finalResult);
  return finalResult;
}
