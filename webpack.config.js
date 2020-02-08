module.exports = [
    {
        entry: {
            'admin/edit-product':'./app/views/admin/edit-product'
        },
        output: {
            filename: './app/bundle/[name].js',
        },
        module: {
            rules: [
                { test: /\.vue$/, use: 'vue-loader' },
            ],
        },
    },

];
