# Semantic Search with Sentence Transformers

*pephub* includes a semantic search feature powered by sentence transformer models. These models are trained to understand the meaning of text and create vector representations of sentences and paragraphs. These vector representations can be used to find semantically similar text by measuring the similarity between the vectors [Fig 1.]. 

By using sentence transformer based semantic search, *pephub* can understand the meaning behind queries and return results that are semantically similar to the query, rather than just matching keywords. This allows for more accurate and relevant search results.

We leverage [Qdrant](https://qdrant.tech) to store, manage, and search through PEP description embeddings. Qdrant (read: quadrant ) is a vector similarity search engine. It provides a production-ready service with a convenient API to store, search, and manage points - vectors with an additional payload.

![Semantic search](../img/SemanticSearch.png)