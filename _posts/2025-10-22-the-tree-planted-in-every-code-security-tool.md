---
layout: post
title: "The Tree Planted in Every Code Security Tool"
date: 2025-10-22 12:00:00 +0000
categories: blog
---

SAST tools are driving modern day code security. They are the easiest to plug into your pipeline and promote yourself from DevOps to DevSecOps Engineer. 

If you've read about how the most prominent ones like Semgrep, CodeQL, Checkmarx, etc work, you'll find a common T in all of them called AST.

What is AST and why is it in your favourite code security tool? 

I'll try to answer this from first principles. I am writing this blog incrementally so I might as well decide to add a code example for a simple AST-based security tool PoC as well. No guarantees though.

## First things first: What is an AST?

**Abstract Syntax Tree (AST)** is a tree representation of the abstract syntactic structure of source code written in a programming language. Each node of the tree denotes a construct occurring in the source code.

It is "abstract" because it doesn't represent every detail appearing in the real syntax, but rather just the structural or content-related details. For instance, grouping parentheses are implicit in the tree structure, and a syntactic construct like `if-condition-then` may be denoted by a single node with two branches.

### Why not just use Regex?

You might wonder, why can't we just `grep` for bugs?
Pattern matching on raw text is fragile. It doesn't understand context.

Consider this Python code:

```python
x = "password123" # Don't catch this comment
password = user_input # Catch this assignment
```

A regex for "password" matches both. An AST parser knows that the first is a **Comment** (and ignores it) and the second is an **Assignment** to a **Variable** named `password`.

### Visualizing the Tree

When code is parsed, it's broken down into tokens, and then structured into a tree.

**Code:**
```javascript
while b !== 0:
    if a > b:
        a = a - b
    else:
        b = b - a
return a
```

**AST (Simplified):**
- **WhileStatement**
  - Test: **BinaryExpression** (`!==`)
    - Left: Identifier (`b`)
    - Right: Literal (`0`)
  - Body: **BlockStatement**
    - **IfStatement**
      - Test: **BinaryExpression** (`>`)...
      - Consequent: **AssignmentExpression**...
      - Alternate: **AssignmentExpression**...

This structure allows security tools to query the *logic* of the code, not just the text. "Find all assignments to variable `x` where the value comes from `user_input`" becomes a traversable path in the tree.
