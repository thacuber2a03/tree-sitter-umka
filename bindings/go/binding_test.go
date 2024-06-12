package tree_sitter_umka_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-umka"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_umka.Language())
	if language == nil {
		t.Errorf("Error loading Umka grammar")
	}
}
