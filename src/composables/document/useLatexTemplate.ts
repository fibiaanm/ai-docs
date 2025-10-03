export interface LatexTemplate {
  name: string;
  description: string;
  content: string;
}

const LATEX_TEMPLATES: Record<string, LatexTemplate> = {
  article: {
    name: 'Article',
    description: 'Standard article document class',
    content: String.raw`\documentclass{article}
\usepackage{amsmath, amssymb}
\usepackage{lipsum}
\title{Your Article Title}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\section{Introduction}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

\section{Literature Review}

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

\subsection{Previous Work}

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

\section{Methodology}

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Mathematical expressions: $E=mc^2$ and display math:
\[
\int_{0}^{\infty} e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}
\]

\section{Results}

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

\section{Conclusion}

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.

\end{document}`
  },
  report: {
    name: 'Report',
    description: 'Report document class with chapters',
    content: String.raw`\documentclass{report}
\usepackage{amsmath, amssymb}
\usepackage{lipsum}
\title{Annual Research Report}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle
\tableofcontents

\chapter{Executive Summary}

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

\section{Key Findings}
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

\chapter{Introduction}

\section{Background}
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

\section{Objectives}
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

\chapter{Methodology}

\section{Data Collection}
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt.

Mathematical model:
\[
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
\]

\section{Analysis Methods}
Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.

\chapter{Results and Discussion}

\section{Primary Results}
At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores.

\section{Statistical Analysis}
Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.

\chapter{Conclusion}

Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.

\end{document}`
  },
  letter: {
    name: 'Letter',
    description: 'Formal letter template',
    content: String.raw`\documentclass{letter}
\signature{Your Name}
\address{Your Address \\ City, State ZIP \\ Country}

\begin{document}
\begin{letter}{Recipient Name \\ Recipient Address \\ City, State ZIP \\ Country}

\opening{Dear Sir or Madam,}

Write your letter content here.

\closing{Sincerely yours,}

\end{letter}
\end{document}`
  },
  beamer: {
    name: 'Presentation',
    description: 'Beamer presentation slides',
    content: String.raw`\documentclass{beamer}
\usepackage{amsmath, amssymb}
\usepackage{lipsum}
\title{Research Presentation}
\author{Your Name}
\institute{Your Institution}
\date{\today}

\begin{document}

\frame{\titlepage}

\begin{frame}
\frametitle{Outline}
\tableofcontents
\end{frame}

\section{Introduction}
\begin{frame}
\frametitle{Background}
\begin{itemize}
\item Research problem and motivation
\item Current state of the field
\item Our contribution
\end{itemize}
\end{frame}

\begin{frame}
\frametitle{Research Question}
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 

\vspace{0.5cm}

\textbf{Key Question:} How can we improve existing methods?

\vspace{0.3cm}

\begin{block}{Hypothesis}
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
\end{block}
\end{frame}

\section{Methodology}
\begin{frame}
\frametitle{Approach}
\begin{enumerate}
\item Data collection and preprocessing
\item Model development
\item Experimental validation
\item Performance evaluation
\end{enumerate}

Mathematical model:
\[
f(x) = \sum_{i=1}^{n} w_i \cdot x_i + b
\]
\end{frame}

\section{Results}
\begin{frame}
\frametitle{Key Findings}
\begin{itemize}
\item Significant improvement over baseline
\item Robust performance across datasets
\item Computational efficiency gains
\end{itemize}

\begin{alertblock}{Important Result}
Achieved 95\% accuracy with 50\% less computation time.
\end{alertblock}
\end{frame}

\section{Conclusion}
\begin{frame}
\frametitle{Summary}
\begin{itemize}
\item Novel approach to the problem
\item Strong experimental results
\item Practical applications
\end{itemize}

\vspace{0.5cm}

\textbf{Future Work:} Extension to larger datasets and real-world deployment.
\end{frame}

\begin{frame}
\frametitle{Thank You}
\centering
\Large Questions?

\vspace{1cm}

\normalsize
Contact: your.email@institution.edu
\end{frame}

\end{document}`
  }
};

export class LatexTemplates {
  public getTemplate(name: string): LatexTemplate | null {
    return LATEX_TEMPLATES[name] || null;
  }

  public getAllTemplates(): LatexTemplate[] {
    return Object.values(LATEX_TEMPLATES);
  }

  public getTemplateNames(): string[] {
    return Object.keys(LATEX_TEMPLATES);
  }
}

export const useLatexTemplates = () => {
  return new LatexTemplates();
};
