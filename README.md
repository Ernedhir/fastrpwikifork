# Fast:V Wiki

## Contributing

Example metadata schema:

```json
{
  "content": {
    "type": "category",
    "name": "Getting Started",
    "slug": "getting-started"
  }
}
```

Markdown files are used to write the content for each category.

## Folder structure

```
docs/
  getting-started/
    content.md
    metadata.json
  jobs/
    content.md
    metadata.json

  [server-id]/
    ooc-rules/
      content.md
      metadata.json
    server-rules/
      content.md
      metadata.json
```
