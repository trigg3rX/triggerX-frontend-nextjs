import {defineField, defineType, defineArrayMember} from 'sanity'

const codeBlockDefinition = defineArrayMember({
  type: 'code',
  name: 'codeBlock', 
  title: 'Code Block',
  options: {
    language: 'javascript', // Default language
    languageAlternatives: [
      {title: 'JavaScript', value: 'javascript'},
      {title: 'TypeScript', value: 'typescript'},
      {title: 'Python', value: 'python'},
      {title: 'Solidity', value: 'solidity'},
      {title: 'Bash', value: 'bash'},
      {title: 'JSON', value: 'json'},
      {title: 'Markdown', value: 'markdown'},
    ],
    withFilename: true, // Allows adding a filename
  },
})

export const postType = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'requires',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'githubUrl',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'redirect',
      type: 'string',
    }),

    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
        }),
        defineArrayMember({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            }),
          ],
        }),
        defineArrayMember({
          type: 'object',
          name: 'buttonLink',
          title: 'Button Link',
          fields: [
            {
              name: 'text',
              title: 'Button Text',
              type: 'string',
              initialValue: 'See the Code',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              description: 'The web address the button should link to',
              type: 'url',
              validation: (Rule) =>
                Rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
            },
          ],
          preview: {
            select: {title: 'text', subtitle: 'url'},
            prepare({title, subtitle}) {
              return {
                title: title || 'Untitled Button',
                subtitle: subtitle || 'No URL set',
              }
            },
          },
        }),
        defineArrayMember({
          type: 'object',
          name: 'disclaimer',
          fields: [
            {
              name: 'title',
              title: 'disclaimer',
              type: 'string',
              initialValue: 'Disclaimer',
            },
            {
              name: 'text',
              title: 'Disclaimer Text',
              type: 'text',
            },
          ],
          preview: {
            select: {
              title: 'title',
              text: 'text'
            },
            prepare(selection: {title?: string; text?: string}) {
              const {title, text} = selection
              return {
                title: title || 'Disclaimer',
                subtitle: text || 'No text'
              }
            }
          }
        }),
        defineArrayMember({
          type: 'object',
          name: 'stepsAccordion',
          title: 'Steps Accordion',
          fields: [
            {
              name: 'heading',
              title: 'Heading',
              type: 'string',
              initialValue: 'STEPS TO IMPLEMENT',
            },
            {
              name: 'steps',
              title: 'Steps',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'step',
                  title: 'Step',
                  fields: [
                    {
                      name: 'title',
                      title: 'Step Title',
                      type: 'string',
                      description:
                        'The text shown when the step is collapsed (e.g., "1 Lorem ipsum dolor...")',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'content',
                      title: 'Step Content',
                      description: 'The detailed content shown when the step is expanded.',
                      type: 'array',
                      of: [
                        defineArrayMember({type: 'block'}),
                        codeBlockDefinition,
                      ],
                    },
                  ],
                  preview: {
                    select: {title: 'title'},
                    prepare({title}) {
                      return {title: title || 'Untitled Step'}
                    },
                  },
                },
              ],
              validation: (Rule) => Rule.required().min(1),
            },
          ],
          preview: {
            select: {title: 'heading', steps: 'steps'},
            prepare({title, steps}) {
              const count = steps ? steps.length : 0
              return {
                title: title || 'Steps Accordion',
                subtitle: `${count} step(s)`,
              }
            },
          },
        }),
        codeBlockDefinition
      ],
    }),
    defineField({
      name: 'headingPairs',
      title: 'Heading Pairs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'h2Heading',
              title: 'H2 Heading',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'displayHeading',
              title: 'Display Heading',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'h2Heading',
              subtitle: 'displayHeading',
            },
          },
        }),
      ],
    }),
  ],

  preview: {
    select: {
      title: 'title',
      media: 'image',
    },
  },
})
