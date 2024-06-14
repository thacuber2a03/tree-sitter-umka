const implSemi = repeat1(/[;\n]/)
const optImplSemi = repeat(/[;\n]/)
const optSeq = (...rules) => optional(seq(...rules))
const repSeq = (...rules) => repeat(seq(...rules))
const delimSeq = (delim, ...rules) => seq(optSeq(...rules), repSeq(delim, ...rules))

module.exports = grammar({
  name: "umka",

  inline: $ => [
    $.decl,
    $.stmt,
    $.primary,
    $.simpleStmt,
    $.expr,
    $.number,
    $.varDecl,
    $.builtinCall,
    $.callStmt // TODO: check if this is fine
  ],

  extras: $ => [
    $.comment,
    /[ \t]/,
  ],

  word: $ => $.ident,

  conflicts: $ => [],

  rules: {
    program: $ => seq(
      optImplSemi,
      optional($.import),
      repeat($.decl)
    ),

    import: $ => choice(
      seq('import', $.importItem),
      seq(
        'import', '(',
        optImplSemi,
        repeat($.importItem),
        ')', implSemi
      )
    ),

    importItem: $ => seq(
      choice(
        seq(field('name', $.ident), '=', $.stringLiteral),
        $.stringImportLiteral
      ),
      implSemi
    ),

    decl: $ => seq(choice(
      $.fnDecl,
      $.methodDecl,
      $.varDecl,
      $.typeDecl,
      $.constDecl,
    )),

    constDecl: $ => seq('const', choice(
      $.constDeclItem,
      seq("(", optImplSemi, repSeq($.constDeclItem), ")", implSemi),
    )),

    constDeclItem: $ => seq(
      field('name', $.ident),
      optional($.exportMark),
      '=', field('value', $.expr),
      implSemi,
    ),

    varDecl: $ => choice($.fullVarDecl, $.shortVarDecl),

    shortVarDecl: $ => alias($.declAssignmentStmt, "shortVarDecl"),

    fullVarDecl: $ => seq("var", choice(
      $.varDeclItem,
      seq("(", optImplSemi, repSeq($.varDeclItem), ")"),
    )),

    varDeclItem: $ => seq(
      field('identifiers', $.typedIdentList),
      optSeq("=", field('value', $.expr)),
      implSemi,
    ),

    exportMark: $ => '*',

    identList: $ => seq(
      $.ident, field('exported', optional('*')),
      repSeq(",", $.ident, field('exported', optional($.exportMark))),
    ),

    typedIdentList: $ => seq($.identList, ":", optional(".."), $.type),

    typeDecl: $ => seq('type',
      choice($.typeDeclItem, seq("(", repSeq($.typeDeclItem), ")"))
    ),

    typeDeclItem: $ => seq(
      field('name', $.ident),
      optional($.exportMark),
      '=', $.type,
      implSemi
    ),

    type: $ => choice(
      $.qualIdent,
      $.ptrType,
      $.arrayType,
      $.dynArrayType,
      $.enumType,
      $.structType,
      $.mapType,
      $.interfaceType,
      $.closureType,
    ),

    ptrType: $ => seq(optional("weak"), '^', $.type),
    arrayType: $ => seq('[', $.expr, ']', $.type),
    dynArrayType: $ => seq('[', ']', $.type),
    enumType: $ => seq('enum', '{', repeat($.enumItem), '}'),
    enumItem: $ => seq(field('name', $.ident), implSemi),
    structType: $ => seq('struct', '{', optImplSemi, repSeq($.typedIdentList, implSemi), '}'),

    mapType: $ => seq('map', '[', $.type, ']', $.type),
    interfaceType: $ => seq('interface', '{', repeat($.interfaceItem), '}'),

    interfaceItem: $ => choice(
      field('type', $.ident),
      seq(field('name', $.ident), $.signature),
    ),

    closureType: $ => seq('fn', $.signature),

    signature: $ => seq(
      $.parameterList,
      optSeq(':', field('return', $.returnType))
    ),

    returnType: $ => choice(
      $.type,
      seq("(", $.type, repSeq(",", $.type), ")"),
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
      implSemi
    ),

    methodDecl: $ => seq("fn",
      field('receiver', $.rcvSignature),
      field('name', $.ident),
      optional(field('exported', '*')),
      field('signature', $.signature),
      optional(field('body', $.block)),
      implSemi
    ),

    rcvSignature: $ => seq("(",
      field('name', $.ident), ":",
      field('type', $.type),
    ")"),

    exprList: $ => seq($.expr, repSeq(",", $.expr)),

    parameterList: $ => seq(
      "(",
      delimSeq(",",
        field('params', $.typedIdentList),
        optSeq('=', field('defaultValue', $.expr)),
      ),
      ")"
    ),

    block: $ => seq("{", optImplSemi, repSeq($.stmt), "}"),

    stmt: $ => choice(
      seq($.block, optImplSemi),
      $.decl,
      seq($.ifStmt, optImplSemi),
      seq(choice($.forStmt, $.forInStmt), optImplSemi),
      seq($.simpleStmt, implSemi),
      seq(alias("continue", $.continueStmt), implSemi),
      seq(alias("break", $.continueStmt), implSemi),
      seq(alias(seq("return", $.exprList), $.returnStmt), implSemi),
    ),

    callStmt: $ => alias($.designator, 'callStmt'),

    ifStmt: $ => seq("if",
      optSeq(field('locals', $.shortVarDecl), implSemi),
      field('condition', $.expr),
      field('consequent', $.block),
      optSeq("else", field('alternative', $.block))
    ),

    forStmt: $ => seq("for",
      optSeq(field('locals', $.shortVarDecl), ";"),
      field('condition', $.expr),
      optSeq(";", field('increment', $.simpleStmt)),
      field('body', $.block),
    ),

    forInStmt: $ => seq("for",
      field('index', $.ident),
      optSeq(",", field('value', seq($.ident, optional("^")))),
      "in", field('expr', $.expr),
      field('body', $.block),
    ),

    simpleStmt: $ => choice(
      $.shortVarDecl,
      $.incDecStmt,
      $.callStmt,
    ),

    incDecStmt: $ => seq($.designator, choice("++", "--")),

    singleAssgnStmt: $ => seq($.designator, "=", $.expr),
    listAssgnStmt: $ => seq($.designatorList, "=", $.exprList),
    designatorList: $ => seq($.designator, repSeq(",", $.designator)),

    expr: $ => choice($.stringLiteral, $.number, $.primary, $.mapLiteral, $.arrayLiteral),

    arrayLiteral: $ => prec(1, seq("{", delimSeq(",", optImplSemi, $.expr), optImplSemi, "}")),
    mapLiteral: $ => seq("{", delimSeq(",", $.expr, ':', optImplSemi, $.expr), optImplSemi, "}"),

    designator: $ => $.primary,

    primary: $ => choice($.qualIdent, $.builtinCall),

    qualIdent: $ => seq(
      optSeq(field('module', $.ident), '::'),
      field('name', $.ident)
    ),

    builtinCall: $ => choice(
      $.builtinCallFmt,
      $.builtinCallMake,
      $.builtinCall1Type,
      $.builtinCallBasic,
    ),

    builtinCallBasic: $ => seq(
      $.qualIdent,
      field('arguments', seq(
        "(", optSeq($.expr, repSeq(",", $.expr)), ")",
      ))
    ),

    builtinCallFmt: $ => seq(
      choice('printf', 'sprintf', 'fprintf', 'scanf', 'sscanf', 'fscanf'),
      field('arguments', seq(
        "(", $.stringFmtLiteral, optSeq(',', $.expr, repSeq(",", $.expr)), ")",
      ))
    ),

    builtinCallMake: $ => seq(
      'make',
      field('arguments', seq(
        "(", $.type, optSeq(',', $.expr), ")",
      ))
    ),

    builtinCall1Type: $ => seq(
      choice('new', 'sizeof', 'typeptr'),
      field('arguments', seq(
        "(", $.type, ")",
      ))
    ),

    ident: $ => /[A-Za-z_][A-Za-z_0-9]*/,

    number: $ => choice($.realNumber, $.hexNumber, $.decNumber),

    decNumber: $ => /[0-9]+/,
    hexNumber: $ => /0x[0-9a-fA-F]+/,

    realNumber: $ => choice(
      /[0-9]+\.[0-9]+/,
      /[0-9]+[Ee]\-?[0-9]+/,
      /[0-9]+\.[0-9]+[Ee]\-?[0-9]+/,
    ),

    charLiteral: $ => seq("'", repeat(choice($.escSeq, /./)), '"'),
    stringLiteral: $ => seq('"', repeat(choice($.escSeq, /./)), '"'),
    stringFmtLiteral: $ => seq('"', repeat(choice($.escSeq, $.fmtSeq, /./)), '"'),
    stringImportLiteral: $ => seq('"', repeat(choice($.escSeq, $.modSeq, /./)), '"'),

    fmtSeq: $ => /\%[-+\s#0]?([0-9]+|\*)?(\.[0-9]*)?(hh|h|l|ll)?[diuxXfFeEgGscv%]/,
    escSeq: $ => choice(/\\[0abefnrtv]/, /\\x[0-9a-fA-F][0-9a-fA-F]*/),
    modSeq: $ => seq(field('name', $.ident), '.um'),

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
