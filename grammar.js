module.exports = grammar({
	name: "umka",

	inline: $ => [
		$.decl,
		$.stmt,
		$.expr,
		$.number,
		$.varDecl,
		$.declAssignmentStmt,
	],

	extras: $ => [
		$.comment,
		/\s/,
	],

	word: $ => $.ident,

	conflicts: $ => [
		[$.fnDecl],
		[$.methodDecl],
	],

	rules: {
		program: $ => seq(
			repeat($.decl)
		),

		decl: $ => choice(
			$.fnDecl,
			$.methodDecl,
			$.varDecl,
		),

		varDecl: $ => choice(
			$.fullVarDecl,
			alias($.declAssignmentStmt, $.shortVarDecl)
		),

		fullVarDecl: $ => seq(
			"var",
			choice(
				$.varDeclItem,
				seq("(", repeat(seq($.varDeclItem, /[\n;]/)), ")"),
			),
		),

		varDeclItem: $ => seq(
			field('identifiers', $.typedIdentList),
			"=", field('value', $.expr)
		),

		identList: $ => seq(
			$.ident, field('exported', optional('*')),
			repeat(seq(",", $.ident, field('exported', optional('*')))),
		),

		typedIdentList: $ => seq($.identList, ":", optional(".."), $.type),

    typeDecl: $ => seq(
      'type',
      choice($.typeDeclItem, seq("(", repeat($.typeDeclItem), ")"))
    ),

    typeDeclItem: $ => seq(
      field('name', $.identifier),
      optional($.exportMark),
      '=',
      $.type,
    ),

    type: $ => choice(
      $.qual_ident,
      $.ptr_type,
      $.array_type,
      $.dynArrayType,
      $.enumType,
      $.struct_type,
      $.map_type,
      $.interface_type,
      $.closure_type,
    ),

    ptr_type: $ => seq(
      optional("weak"),
      '^',
      $.type,
    ),

    array_type: $ => seq(
      '[',
      $.expr,
      ']',
      $.type,
    ),

    dynArrayType: $ => seq('[', ']', $.type),

    enumType: $ => seq('enum', '{', repeat($.enumItem), '}'),
    enumItem: $ => seq(field('name', $.identifier)),
    structType: $ => seq('struct', '{', repeat(seq($.typedIdentList, /[\n;]/)), '}'),

    mapType: $ => seq('map', '[', $.type, ']', $.type),
    interface_type: $ => seq(
      'interface',
      '{',
      repeat($.interface_item),
      '}',
    ),
    interface_item: $ => choice(
      field('type', $.identifier),
      seq(
        field('name', $.identifier),
        $.signature
      ),
    ),
    closure_type: $ => seq(
      'fn',
      $.signature,
    ),
    signature: $ => seq(
      $.parameter_list,
      optional(seq(':', $.type)),
    ),
    qual_ident: $ => choice(
      field('ident', $.identifier),
      seq(field('module', $.identifier), '::', field('ident', $.identifier))
    ),

		declAssignmentStmt: $ => seq(
			field('identifiers', $.identList),
			":=", field('values', $.exprList)
    ),

		fnDecl: $ => seq("fn",
			field('name', $.ident),
			optional(field('exported', '*')),
			field('signature', $.signature),
			optional(field('body', $.block)),
		),

		methodDecl: $ => seq("fn",
			field('receiver', $.rcvSignature),
			field('name', $.ident),
			optional(field('exported', '*')),
			field('signature', $.signature),
			optional(field('body', $.block)),
		),

		rcvSignature: $ => seq("(",
			field('name', $.ident), ":",
			field('type', $.type), ")"
		),

		exprList: $ => seq($.expr, repeat(seq(",", $.expr))),

		signature: $ => seq("(", optional(seq(
			field('params', $.typedIdentList),
			optional(seq('=', field('defaultValue', $.expr))),
		)), ")"),

		block: $ => seq("{", repeat(seq($.stmt, optional(';'))), "}"),

		stmt: $ => choice(
			alias($.designator, $.callStmt),
			$.block,
			$.decl,
		),

		expr: $ => choice($.stringLiteral, $.number),

		designator: $ => seq(choice($.primary)),

		primary: $ => choice($.qualIdent, $.builtinCall),

		qualIdent: $ => seq(
			optional(seq(field('module', $.ident), '::')),
			field('identifier', $.ident)
		),

		builtinCall: $ => seq(
			field('name', $.qualIdent),
			field('arguments', seq("(", optional(seq($.expr, repeat(seq(",", $.expr)))), ")"))
		),

		ident: $ => /[A-Za-z_][A-Za-z_0-9]*/,

		number: $ => choice($.realNumber, $.hexNumber, $.decNumber),

		decNumber: $ => /[0-9]+/,
		hexNumber: $ => /[0-9a-fA-F]+/,

		realNumber: $ => choice(
			/[0-9]+\.[0-9]+/,
			/[0-9]+[Ee]\-?[0-9]+/,
			/[0-9]+\.[0-9]+[Ee]\-?[0-9]+/,
		),

		charLiteral: $ => seq("'", repeat(choice($.escSeq, /./)), '"'),
		stringLiteral: $ => seq('"', repeat(choice($.escSeq, /./)), '"'),

		escSeq: $ => choice(/\\[0abefnrtv]/, /\\x[0-9a-fA-F][0-9a-fA-F]*/),

		comment: $ => token(choice(
			seq('//', /.*/),
			seq(
				'/*',
				/[^*]*\*+([^/*][^*]*\*+)*/,
				'/',
			),
		)),
	}
})
