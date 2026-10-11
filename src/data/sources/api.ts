export const searchMotosAPI = async (make: string, model: string) => {
  const url = new URL('https://api.api-ninjas.com/v1/motorcycles');
  if (make) url.searchParams.append('make', make);
  if (model) url.searchParams.append('model', model);

  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': 'pyqgTVacPOr8s0pmJK2bj20XT1AsJ6dRYASLFz4C'
    }
  });

  if (!response.ok) {
    throw new Error('Error al buscar en la API de motos');
  }

  return response.json();
};
