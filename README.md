# Yuting Xia — Personal Website

A personal website and course blog built with Quarto, preserving the course template’s Home, About Me, Resume, and Blog structure.

- **Website:** https://xia071212.github.io/myrepo/
- **Blog 1:** https://xia071212.github.io/myrepo/blog/posts/post1/Untitled.html

## Repository layout

```text
_quarto.yml                 Website configuration
index.qmd                   Home page
bio.qmd                     About Me: education, interests, contact
resume.qmd                  Resume request page
about.qmd                   Original auxiliary About page
styles.css                  Shared pink-and-blue styling
images/
  profile-yuting.jpg         Selected avatar
  UniversityofPennsylvania_FullLogo_RGB.png
  profile.png                Retained template avatar
  blog1/
    sunk-cost.svg            Editable decision diagram
    sunk-cost-movie-comic.png Explanatory comic
    template-figure1.png     Retained classroom example, unused
blog/
  index.qmd                 Automatically generated post listing
  posts/
    post1/
      Untitled.qmd          Sunk-cost article (original URL preserved)
      _includes/
        decision-widget.qmd Interactive example markup
        interactive.html    Slider calculations
    post2/
      index.qmd             Reserved second post, not yet written
docs/                       Generated website served by GitHub Pages
```

Edit source files outside `docs/`; regenerate the published output rather than editing generated HTML directly. Shared source images live in `images/`. Quarto copies referenced images into the corresponding `docs/images/` directories during rendering.

## Build and preview

Requires [Quarto](https://quarto.org/docs/get-started/). No R or Python execution, data downloads, API keys, or external JavaScript packages are needed for the current pages.

From this repository’s root:

```sh
quarto render
quarto preview --no-browser
```

Open the local address printed by Quarto. The pages use native MathML, an SVG diagram, a PNG comic, and plain JavaScript for the optional stock example.

## Blog 1: sources and reproducibility

The article explains sunk costs, why they feel unintuitive, common misunderstandings, and everyday implications. Its definition and movie example refer to OpenStax, *Principles of Economics 3e*, section 2.1, “Sunk Costs”:

https://openstax.org/books/principles-economics-3e/pages/2-1-how-individuals-make-choices-based-on-their-budget-constraint

All numerical examples are hypothetical. The movie comic was created with AI assistance. No market dataset is used.

The project example compares an additional cost of $40 with future benefits of $70 or $30. Stopping has no additional payoff, and the amounts include all relevant future consequences.

The optional stock illustration fixes today’s sale value at 60. For purchase price P and expected future price F, selling gives `60 - P` relative to purchase; holding gives `F - P` in expectation. Holding’s expected advantage is `F - 60`, independent of P. The example excludes dividends, interest, taxes, trading costs, and risk adjustment. Slider inputs and results can be inspected in the article’s `_includes/` directory.

## Update GitHub Pages

The published site uses the generated `docs/` folder on `main`. After editing and reviewing the site:

1. Run `quarto render`.
2. Check local navigation, images, the resume request link, and the optional illustration.
3. Commit the intended source changes together with the regenerated `docs/` output.
4. Push to `main`, then check the GitHub Pages deployment and live article.

The website text reflects the author’s confirmed expected graduation date of December 2027. The resume PDF and phone number are not published. The resume page provides an email request link.
