import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Example: fetch dynamic URLs from your database or API
  // const properties = await fetchPropertiesFromDB();

  const staticUrls = [
    '',
    'about',
    'contact',
    'landlord-dashboard',
    'tenant-dashboard',
    // Add more static routes as needed
  ];

  // const propertyUrls = properties.map(p => `property/${p.id}`);

  const urls = [
    ...staticUrls,
    // ...propertyUrls,
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `<url>
  <loc>https://lakazhub.com/${path}</loc>
  <priority>${path === '' ? '1.0' : '0.7'}</priority>
</url>`
  )
  .join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.write(sitemap);
  res.end();
}
