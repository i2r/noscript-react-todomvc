ns.log.exception = console.log;

ns.router.baseDir = '/';
ns.router.routes = {
    route: {
        '{filter:id=all}': 'app'
    }
};

ns.layout.define('app', {
    app: {
        'appBox@': {
            // patchedWrapper: {
                'patchedView': true
            // }
        }
    }
    // app: {
    //     'todoapp&': {
    //         'header': true,
    //         'boxList@': {
    //             'list': true
    //         },
    //         'boxFooter@': {
    //             'footer': true
    //         }
    //     }
    // }
});

ns.Model.define('todo', {
    params: {
        id: null
    }
});
ns.Model.define('list', {
    split: {
        items: '/',
        model_id: 'todo',
        params: {
            'id': '.id'
        }
    },
    methods: {
        request: function() {
            var promise = new Vow.Promise();

            setTimeout(function() {
                promise.fulfill([
                    {id: ++this.gid, caption: 'Greet the World!', done: false},
                    {id: ++this.gid, caption: 'Make it awesome', done: false}
                ]);
            }.bind(this), 500);

            return promise.then(function(data) {
                this.setData(data);
            }, this);
        },
        appendTodo: function(caption) {
            var todo = ns.Model.get('todo', { id: ++this.gid });

            todo.setData({
                caption: caption,
                done: false
            });
            this.insert(todo);
        },
        getFilteredModels: function(filter) {
            return this.models.filter(function(todo) {
                switch (filter) {
                    case 'all':
                        return true;
                    case 'active':
                        return !todo.get('.done');
                    case 'completed':
                        return todo.get('.done');
                }
            });
        },
        getCountItemsLeft: function() {
            return this.models.filter(function(todo) {
                return !todo.get('.done');
            }).length;
        },
        gid: 0
    }
});

ns.View.define('app');
ns.View.define('patchedWrapper');

ns.View.define('patchedView', {
    methods: {
        patchLayout() {
            return 'patched';
        }
    }
});

ns.layout.define('patched', {
    'patchedViewContentBox@': {
        'patchedViewContent&': {
            'patchedSubview': true
        }
    }
});

ns.View.define('patchedViewContent', {
    models: ['patchedModel'],
    events: {
        'ns-view-init': () => {
            console.log('INIT VIEW');
        },
        'ns-view-htmlinit': () => {
            console.log('HTMLINIT VIEW');
        },
        'ns-view-show': () => {
            console.log('SHOW VIEW');
        }
    },
    component: {
        render() {
            if (this.props.view.isLoading()) {
                return (
                    <div className="patched-view-loading">
                        LOADING VIEW'S MODEL
                    </div>
                );
            }

            return (
                <div className="patched-view">
                    <div className="patched-view-child">
                        VIEW →
                    </div>
                    {this.createChildren()}
                </div>
            );
        }
    }
});

ns.Model.define('patchedModel', {
    methods: {
        request() {
            // this.setData({loaded: true});
            return Vow.fulfill({});
        }
    }
});

ns.View.define('patchedSubview', {
    events: {
        'ns-view-init': () => {
            console.log('INIT SUB');
        },
        'ns-view-htmlinit': () => {
            console.log('HTMLINIT SUB');
        },
        'ns-view-show': function() {
            console.log('SHOW SUB', this.node);
        }
    },
    component: {
        render() {
            if (this.props.view.isLoading()) {
                return (
                    <div className="patched-subview-loading">
                        LOADING SUB'S MODEL
                    </div>
                );
            }

            return (
                <div className="patched-subview">
                    SUBVIEW
                </div>
            );
        }
    }
});

ns.View.define('todoapp', {
    models: ['list'],
    component: {
        render: function() {
            return (
                <section className="todoapp">
                    {!this.props.view.isLoading()
                        ? this.createChildren()
                        : <h1>Loading</h1>}
                </section>
            );
        }
    }
});
ns.View.define('header', {
    component: {
        handleSubmit: function(e) {
            e.preventDefault();
            var todo = this.refs.input.value.trim();
            if (todo) {
                ns.Model.get('list').appendTodo(todo);
            }
            this.refs.input.value = '';
        },
        render: function() {
            return (
                <header className="header">
                    <h1>todos</h1>
                    <form ref="form" onSubmit={this.handleSubmit}>
                        <input ref="input" className="new-todo" placeholder="What needs to be done?" autofocus="true" defaultValue="" />
                    </form>
                </header>
            );
        }
    }
});
ns.ViewReactCollection.define('list', {
    models: {
        list: {
            'ns-model-insert': 'update',
            'ns-model-remove': 'update'
        }
    },
    split: {
        byModel: 'list',
        intoViews: 'todo'
    },
    'params+': {
        filter: 'all'
    },
    methods: {
        update: function() {
            ns.page.go();
        }
    },
    component: {
        render: function() {
            var filter = this.props.view.params.filter;
            return (
                <ul className="todo-list">
                    {this.createChildren(this.props.models.list.getFilteredModels(filter))}
                </ul>
            );
        }
    }
});
ns.ViewReact.define('todo', {
    models: {
        todo: {
            'ns-model-changed': 'update'
        }
    },
    methods: {
        update: function() {
            ns.page.go();
        }
    },
    component: {
        ENTER_KEY: 13,
        getInitialState: function() {
            return {
                checked: this.getModelData('todo', '.done'),
                editing: false
            };
        },
        componentDidUpdate: function() {
            if (this.state.editing) {
                this.refs.name.focus();
            }
        },
        onCheckTodo: function() {
            var checked = !this.state.checked;
            this.setState({
                checked: checked
            });
            this.props.models.todo.set('.done', checked);
        },
        removeTodo: function() {
            ns.Model.get('list').remove(this.props.models.todo);
        },
        setEditing: function() {
            this.setState({
                editing: true
            });
            document.addEventListener('click', this.onClickSpace);
        },
        onClickSpace: function(e) {
            if (e.target === this.refs.name) {
                return;
            }
            this.setState({
                editing: false
            });
            document.removeEventListener('click', this.onClickSpace);
        },
        tryChangeName: function(e) {
            if (e.charCode === this.ENTER_KEY) {
                const name = this.refs.name.value;
                if (name) {
                    this.props.models.todo.set('.caption', name);
                    this.setState({
                        editing: false
                    });
                }
            }
        },
        render: function() {
            const className = [
                this.state.checked ? 'completed': '',
                this.state.editing ? 'editing': ''
            ].join(' ');

            return (
                <li className={className} onDoubleClick={this.setEditing}>
                    <div className="view">
                        <input className="toggle" type="checkbox" checked={this.state.checked} onChange={this.onCheckTodo} />
                        <label>{this.getModelData('todo', '.caption')}</label>
                        <button className="destroy" onClick={this.removeTodo}></button>
                    </div>
                    <input ref="name" className="edit" placeholder={this.getModelData('todo', '.caption')} onKeyPress={this.tryChangeName} />
                </li>
            );
        }
    }
});
ns.ViewReact.define('footer', {
    models: ['list'],
    'params+': {
        filter: 'all'
    },
    component: {
        render: function() {
            var currentFilter = this.props.view.params.filter;
            var countItemsLeft = this.props.models.list.getCountItemsLeft();
            return (
                <footer className="footer">
                    <span className="todo-count"><strong>{countItemsLeft}</strong> {countItemsLeft > 1 ? 'items' : 'item'} left</span>
                    <ul className="filters">
                        {['all', 'active', 'completed'].map(function(filter) {
                            return (
                                <li key={filter}>
                                    <a className={filter === currentFilter ? 'selected' : ''} href={ns.router.baseDir + '?filter=' + filter}>{filter}</a>
                                </li>
                            );
                        })}
                    </ul>
                </footer>
            );
        }
    }
});

ns.page.title = no.nop;

ns.init();
ns.page.go();
