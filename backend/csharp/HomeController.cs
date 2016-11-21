using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Mvc.Ajax;
using BaiduBce;
using BaiduBce.Auth;
using BaiduBce.Internal;
using Newtonsoft.Json;
using BaiduBce.Util;
using System.Text;
using System.Security.Cryptography;
using BaiduBce.Services.Sts;
using BaiduBce.Services.Sts.Model;

namespace BaiduCloudEngine.Controllers
{
  class SignatureResult
  {
    public int statusCode { get; set; }
    public string signature { get; set; }
    public string xbceDate { get; set; }
  }

  class PolicySignatureResult
  {
    public string policy { get; set; }
    public string signature { get; set; }
    public string accessKey { get; set; }
  }

  public class HomeController : Controller
  {
    private static string EncodeHex (byte[] data)
    {
      var sb = new StringBuilder ();
      foreach (var b in data) {
        sb.Append (BceV1Signer.HexTable [b]);
      }
      return sb.ToString ();
    }

    public string Index (string httpMethod, string path, string queries, string headers, string policy, string sts, string callback)
    {
      string ak = "<your ak>";
      string sk = "<your sk>";
      BceClientConfiguration config = new BceClientConfiguration () {
        Credentials = new DefaultBceCredentials (ak, sk)
      };

      string result = null;
      if (sts != null) {
        StsClient client = new StsClient (config);
        string accessControlList = sts;
        GetSessionTokenRequest request = new GetSessionTokenRequest () {
          DurationSeconds = 60 * 60 * 24,
          AccessControlList = accessControlList
        };
        GetSessionTokenResponse response = client.GetSessionToken (request);
        result = JsonConvert.SerializeObject (response);
      }
      else if (policy != null) {
        string base64 = Convert.ToBase64String (Encoding.UTF8.GetBytes (policy));
        var hash = new HMACSHA256 (Encoding.UTF8.GetBytes (sk));
        string signature = EncodeHex (hash.ComputeHash (Encoding.UTF8.GetBytes (base64)));
        result = JsonConvert.SerializeObject (new PolicySignatureResult () {
          policy = base64,
          signature = signature,
          accessKey = ak,
        });
      } else {
        InternalRequest internalRequest = new InternalRequest ();
        internalRequest.Config = config;
        internalRequest.Uri = new Uri ("http://www.baidu.com" + path);
        internalRequest.HttpMethod = httpMethod;
        if (headers != null) {
          internalRequest.Headers = JsonConvert.DeserializeObject<Dictionary<string, string>> (headers);
        }
        if (queries != null) {
          internalRequest.Parameters = JsonConvert.DeserializeObject<Dictionary<string, string>> (queries);
        }

        BceV1Signer bceV1Signer = new BceV1Signer ();
        string sign = bceV1Signer.Sign (internalRequest);

        string xbceDate = DateUtils.FormatAlternateIso8601Date (DateTime.Now);
        result = JsonConvert.SerializeObject (new SignatureResult () {
          statusCode = 200,
          signature = sign,
          xbceDate = xbceDate,
        });
      }

      if (callback != null) {
        result = callback + "(" + result + ")";
      }

      return result;
    }
  }
}
