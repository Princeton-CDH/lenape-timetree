# Change log

## 1.0.1

- Minor content edits and revisions.
- bugfix to figure shortcode handling for attribution links

## 1.0

Soft launch, June 2023.

### timetree display & interaction

- As a user, I want timetree data points represented by leaf shapes so that the interface is more organic and I can more easily understand the visual as a tree.
- As a user, I want to see labels for leaves in the tree so I'll have a sense of the content and reasons to select specific leaves.
- As a user, I want to see tree branches as part of the timetree so I can more easily understand and read the visualization as a tree and see how the leaves connect.
- As a user I want both leaf and label highlighted when I hover over either, so I can see the connected content as I browse the tree.
- As a user, I want to see a legend for the branches in the intro panel so that I can understand the content is organized by themes and recognize the meaning of the leaf colors.
- As a user, I want to see all the leaves in the timetree so I can be confident I'm seeing all the content.
- As a user I want to see and interact with a the plaque on the trunk of the tree so I can read who the project is dedicated to.

### leaf details

- As a user, when I select a leaf in the timetree, I want to see details for that event so that I can read about it in detail.
- As a user, when I select a leaf to read more details, I want the leaf and label highlighted in the tree view so that I can see and remember what I selected.
- As a user, I want an indicator in the leaf details panel of what branch the leaf belongs to, so that the themes and organization will be more clear as I navigate the timetree.
- As a user, I want the url to change when I select a leaf so that I can bookmark or share the timetree with a specific leaf selected.

### tags

- As a user, when I select a tag in the leaf detail view, I want other leaves with that tag to be highlighted so that I can explore related content.
- As a user, when I select a tag I want to clearly see which tag is active so I can tell that I'm looking at a filtered view of the tree.
- As a user, when I select a tag I want it to stay active until I close it, so that I can more easily browse the leaves with that tag.
- As a user, I want the url to change when I select a tag so that I can bookmark or share the timetree with a specific tag selected.
- As a user, I want to browse a list of tags so that I can see how the data in the timetree is categorized.
- As a user, when I select a tag from the tag index page, I should be taken to the timetree with that tag active so that I can browse all leaves with that tag.

### mobile

- As a mobile user, I want a way to get back to the project introduction after I've closed it, so I can refer back to it after exploring the timetree.
- As a mobile user, I should see some leaf labels when the tree is not zoomed, so I can more easily understand that I can interact with the tree.
- As a user on a smaller screen, I want to zoom in on the timetree so that I can view and interact with the content more easily.

### accessibility

- As a user, I want the option of zooming in on the timetree on desktop and with buttons, so that the content and functionality is accessible in a variety of modes.
- As a keyboard or screen user, I want to navigate the timetree without a mouse or touch device so that I can explore the content in multiple paths and access all the information in a manner that is equivalent to the experience of a sighted user.

### error handling

- As a user, I should see a message if the leaf details fail to load so that I understand something went wrong.
- As a user I want to know when a page is not found so that I can understand what went wrong and navigate to other parts of the site.
- As a user with javascript turned off, I want to see a message explaining why I can't see the timetree so I can turn it on if I want to view it.

### content pages

- As a user, I want to access site navigation in the footer so I can find and access content related to the project.
- As a user, I want to read about the project so that I can understand who created it and find related resources.
- As a user who finds a leaf detail page from search, I should be prompted to view that leaf in the context of the timetree so that I can experience the project as intended.
- As a user, I want to see an indicator when a link takes me to another site or a PDF, so I know what to expect if I click on it.

### content editing

- Contributor documentation
- As a content editor, I want to optionally include images in leaf content so that I can provide illustrations and visual engagement for the timetree information.
- As a content editor, I want the option of a display title for use in the timetree so that I can use different titles in the leaf detail view and in the tree.
- As a team member, I want a way to turn on a visual debug mode so that I can understand how the layout is being generated.
- As a content editor, I want the option of marking a leaf as a draft so that I can unpublish content that isn't ready for inclusion in the timetree.
- As a content admin, I want leaves automatically positioned in the tree based on their branch and century, so that the display follows the agreed upon logic.

### design

- sitemap and flow
- home page / timetree layout and sizing; grid and flow for mobile/desktop
- color scheme and color palette for the leaves
- logic for interaction with leaves, tags
- logic for zoom behaviors
- typography and font for body content
- background image on content pages for visual identity

## Earlier versions / preliminary work

- Set up initial Hugo site with proposed site and data structure
- As a site editor, I want to run a script to import project data into the new Hugo page/data structure, so that existing content can be loaded in bulk.
- As a site editor, I want to import project data from multiple files without overwriting hugo content, so that I can import or update multiple groups of data at the same time.
- As a content editor, I want to see tags, sort date, and branch on leaf summary cards, so that I can review the imported data more easily.
- As a content editor, I want the leaves and branches in the tree to be displayed in configured order so that the content is displayed more logically and consistently.

utils / infrastructure:

- pre-commit hooks for automated & consistent formatting
