/** @jsx React.DOM */

var stocks = [
    {name: 'Google', symbol:'GOOG'},
    {name: 'Facebook', symbol:'FB'}
];

var App = React.createClass({
    getInitialState: function() {
        return {stocks: stocks};
    },
    componentDidMount: function() {
        var self = this;
        setTimeout(function() {
            self.setState({
                stocks: [
                    {name: 'Microsoft', symbol:'MSFT'}
                ]
            });
        }, 1000)
    },
    render: function() {
        return (
            <div>
                <header></header>
                <section>
                    <Home stocks={this.state.stocks} />
                </section>
                <footer>Footer</footer>
            </div>
        );
    }
});

var Home = React.createClass({
    render: function() {
        return (
            <div>
                <p>This is the home template.</p>
                <Watchlist stocks={this.props.stocks}/>
            </div>
        );
    }
});

var Watchlist = React.createClass({
    render: function() {
        var stockNodes = this.props.stocks.map(function(s) {
            return (
                <li key={s.symbol}>{s.symbol}: {s.name}</li>
            );
        });
        return (
            <div>
                <h2>Watchlist</h2>
                <ul>
                    {stockNodes}
                </ul>
            </div>
        )
    }
});

React.renderComponent(<App />, $('#root')[0]);
