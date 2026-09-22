import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://api.buffer.com';
const PROFILE_URL = 'https://www.linkedin.com/in/klariartavia/';
const MAX_POSTS = 6;
const token = process.env.BUFFER_API_KEY;

if (!token) {
  throw new Error('Missing BUFFER_API_KEY. Add it as a GitHub Actions repository secret.');
}

async function graphql(query) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    throw new Error(`Buffer request failed with HTTP ${response.status}.`);
  }
  if (body.errors?.length) {
    throw new Error(`Buffer GraphQL error: ${body.errors.map((error) => error.message).join('; ')}`);
  }
  return body.data;
}

function gqlString(value) {
  return JSON.stringify(String(value));
}

function cleanText(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function withoutLinks(value) {
  return value.replace(/https?:\/\/\S+/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function truncate(value, limit) {
  if (value.length <= limit) return value;
  const shortened = value.slice(0, limit - 1).replace(/\s+\S*$/, '').trim();
  return `${shortened || value.slice(0, limit - 1)}…`;
}

function cardCopy(text) {
  const cleaned = cleanText(text);
  const lines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  const firstLine = withoutLinks(lines[0] || cleaned);
  const firstSentence = firstLine.match(/^.{12,110}?[.!?](?:\s|$)/)?.[0]?.trim();
  const title = truncate(firstSentence || firstLine || 'Latest LinkedIn post', 92);

  let remainder = lines.slice(1).join(' ');
  if (firstSentence && firstLine.length > firstSentence.length) {
    remainder = `${firstLine.slice(firstSentence.length).trim()} ${remainder}`.trim();
  }
  const description = truncate(withoutLinks(remainder || cleaned), 360);
  return { title, description };
}

function hashtags(text) {
  const matches = [...String(text || '').matchAll(/#([\p{L}\p{N}_-]+)/gu)];
  return [...new Set(matches.map((match) => match[1]))].slice(0, 3);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

async function organizations() {
  const data = await graphql(`
    query GetOrganizations {
      account {
        organizations { id name }
      }
    }
  `);
  return data.account?.organizations || [];
}

async function linkedinChannels(organizationId) {
  const data = await graphql(`
    query GetChannels {
      channels(input: { organizationId: ${gqlString(organizationId)} }) {
        id
        name
        displayName
        service
        isDisconnected
      }
    }
  `);
  return (data.channels || []).filter((channel) =>
    channel.service === 'linkedin' && !channel.isDisconnected
  );
}

async function sentPosts(organizationId, channelIds) {
  const ids = channelIds.map(gqlString).join(', ');
  const data = await graphql(`
    query GetLinkedInPosts {
      posts(
        first: 30
        input: {
          organizationId: ${gqlString(organizationId)}
          filter: { status: [sent], channelIds: [${ids}] }
          sort: [{ field: createdAt, direction: desc }]
        }
      ) {
        edges {
          node {
            id
            text
            sentAt
            createdAt
            externalLink
          }
        }
      }
    }
  `);
  return (data.posts?.edges || []).map((edge) => edge.node);
}

const orgs = await organizations();
if (!orgs.length) throw new Error('No Buffer organization is available to this API key.');

const collected = [];
let channelCount = 0;

for (const organization of orgs) {
  const channels = await linkedinChannels(organization.id);
  if (!channels.length) continue;
  channelCount += channels.length;
  collected.push(...await sentPosts(organization.id, channels.map((channel) => channel.id)));
}

if (!channelCount) {
  throw new Error('No connected LinkedIn channel was found in Buffer.');
}
if (!collected.length) {
  throw new Error('The connected LinkedIn channel has no sent posts available in Buffer.');
}

const unique = [...new Map(collected.map((post) => [post.id, post])).values()]
  .sort((a, b) => new Date(b.sentAt || b.createdAt) - new Date(a.sentAt || a.createdAt))
  .slice(0, MAX_POSTS);

const posts = unique.map((post, index) => {
  const copy = cardCopy(post.text);
  const content = { t: copy.title, d: copy.description };
  const publishedAt = post.sentAt || post.createdAt;
  return {
    id: post.id,
    date: formatDate(publishedAt),
    publishedAt,
    feat: index < 3,
    url: post.externalLink || PROFILE_URL,
    tags: hashtags(post.text),
    en: content,
    es: content,
  };
});

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(root, 'assets/linkedin-posts.json');
let previous = null;

try {
  previous = JSON.parse(await readFile(outputPath, 'utf8'));
} catch {
  // The first successful synchronization creates the feed.
}

if (JSON.stringify(previous?.posts || []) === JSON.stringify(posts)) {
  console.log(`LinkedIn feed is already current (${posts.length} posts).`);
  process.exit(0);
}

const output = {
  generatedAt: new Date().toISOString(),
  source: 'buffer',
  posts,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Updated LinkedIn feed with ${posts.length} posts from ${channelCount} channel(s).`);
