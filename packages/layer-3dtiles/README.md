# 3dtiles插件
[![NPM Version](https://img.shields.io/npm/v/@maptalks/3dtiles.svg)](https://www.npmjs.com/package/@maptalks/3dtiles)

maptalks用于载入3dtiles数据的图层插件

# 示例代码
```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/maptalks@next/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@maptalks/gl/dist/maptalksgl.js"></script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/@maptalks/3dtiles@latest/dist/maptalks.3dtiles.js"></script>
<script>
const layer = new maptalks.Geo3DTilesLayer('3dtiles', {        
    maxCacheSize : 1000, //缓存的最大瓦片数
    // loadingLimitOnInteracting : 1, //地图交互过程中瓦片请求最大数量
    // loadingLimit : 0, //瓦片请求最大数量
    services : [
        {
            url : 'path/to/tileset.json',
            // maximumScreenSpaceError值越小，加载的模型越清晰，但加载的数据量会变大
            // 清晰度可以接受的情况下，推荐把这个值设得越大越好，性能会越好
            maximumScreenSpaceError : 24.0,
            // urlParams : 'v=0.0',
            // ajaxOptions : { credentials : 'include' },
            // 把模型降低1200米
            heightOffset : -1200,
            ambientLight : [0.0, 0.0, 0.0],
            // maxExtent : maxExtent
            // ajaxInMainThread : true, //从主线程发起ajax请求，用于worker发起ajax报跨域错误
        },
        // 其他的3dtiles数据源
    ]
});
layer.addTo(map);
</script>

```

# 配置说明
## I3S数据gzip解压

i3s数据默认都进行了gzip压缩（以.gz结尾），需要在http服务中配置url rewrite和gzip解压。

### IIS配置
* 下载安装[url rewrite模块](https://www.iis.net/downloads/microsoft/url-rewrite)
* 在文件夹目录下创建web.config，配置gz解压和url write:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".json.gz" />
      <remove fileExtension=".bin.gz" />
      <mimeMap fileExtension=".json.gz" mimeType="application/json" />
      <mimeMap fileExtension=".bin.gz" mimeType="application/octet-stream" />
    </staticContent>
    <rewrite>
      <outboundRules rewriteBeforeCache="true">
        <rule name="Custom gzip file header">
          <match serverVariable="RESPONSE_CONTENT_ENCODING" pattern=".*" />
          <conditions>
            <add input="{REQUEST_URI}" pattern="\.gz$" />
          </conditions>
          <action type="Rewrite" value="gzip"/>
        </rule>
      </outboundRules>
      
      <rules>
        <rule name="Rewrite gzip file">
          <match url="(.*)"/>
          <conditions>
            <add input="{HTTP_ACCEPT_ENCODING}" pattern="gzip" />
            <add input="{REQUEST_FILENAME}.gz" matchType="IsFile" />
          </conditions>
          <action type="Rewrite" url="{R:1}.gz" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```
