import { config, collection, singleton, fields } from '@keystatic/core';

// Local mode for now — switches to GitHub mode at the deploy step so Nick can
// edit from the deployed site (see execution step 8).
export default config({
  storage: { kind: 'local' },
  ui: {
    brand: { name: 'nickkidd.net' },
  },
  collections: {
    projects: collection({
      label: 'Projects',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { data: 'json' },
      columns: ['order', 'category', 'year'],
      entryLayout: 'form',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        order: fields.number({
          label: 'Order',
          description: 'Display order on the Work page and home showcase (1 = first)',
          validation: { isRequired: true },
        }),
        client: fields.text({ label: 'Client' }),
        role: fields.text({ label: 'Role' }),
        category: fields.text({ label: 'Category', validation: { isRequired: true } }),
        year: fields.text({ label: 'Year', description: 'e.g. 2024 or 2015-2020' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        image1: fields.image({
          label: 'Image 1 (hero)',
          description: 'Project page hero. Ignored if Video 1 is set.',
          directory: 'src/assets/projects',
          publicPath: '../../assets/projects/',
        }),
        video1: fields.file({
          label: 'Video 1 (hero video)',
          description: 'Optional .mp4 — when set, the project hero becomes this video (muted, looping).',
          directory: 'public/assets/projects/video',
          publicPath: '/assets/projects/video/',
        }),
        heroEmbed: fields.url({
          label: 'Hero video embed',
          description: 'Optional YouTube/Vimeo URL shown in the hero band under the image',
        }),
        videoEmbeds: fields.array(fields.url({ label: 'Video URL' }), {
          label: 'Video embeds (after the story)',
          itemLabel: (p) => p.value ?? 'video',
        }),
        image2: fields.image({ label: 'Image 2', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image3: fields.image({ label: 'Image 3', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image4: fields.image({ label: 'Image 4', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image5: fields.image({ label: 'Image 5', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image6: fields.image({ label: 'Image 6', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image7: fields.image({ label: 'Image 7', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image8: fields.image({ label: 'Image 8', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image9: fields.image({ label: 'Image 9', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        image10: fields.image({ label: 'Image 10', directory: 'src/assets/projects', publicPath: '../../assets/projects/' }),
        overview: fields.markdoc.inline({ label: 'Overview' }),
        approach: fields.markdoc.inline({ label: 'Approach' }),
        outcome: fields.markdoc.inline({ label: 'Outcome' }),
      },
    }),
    blog: collection({
      label: 'Blog posts',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'body' },
      columns: ['date', 'category'],
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Date', validation: { isRequired: true } }),
        category: fields.text({ label: 'Category' }),
        mainImage: fields.image({
          label: 'Main image',
          directory: 'src/assets/blog',
          publicPath: '../../assets/blog/',
        }),
        mainVideo: fields.file({
          label: 'Main video',
          description: 'Optional .mp4 — replaces the main image when set (same rule as project heroes).',
          directory: 'public/assets/blog/video',
          publicPath: '/assets/blog/video/',
        }),
        image1: fields.image({ label: 'Image 1', directory: 'src/assets/blog', publicPath: '../../assets/blog/' }),
        image2: fields.image({ label: 'Image 2', directory: 'src/assets/blog', publicPath: '../../assets/blog/' }),
        body: fields.markdoc({ label: 'Body' }),
      },
    }),
  },
  singletons: {
    author: singleton({
      label: 'Author',
      path: 'src/data/author',
      format: { data: 'json' },
      schema: {
        name: fields.text({ label: 'Name' }),
        job: fields.text({ label: 'Job title' }),
        description: fields.text({ label: 'Description' }),
        image: fields.image({ label: 'Photo', directory: 'public/assets', publicPath: '/assets/' }),
      },
    }),
  },
});
