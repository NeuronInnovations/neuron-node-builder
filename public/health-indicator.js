// public/health-indicator.js
// Polls /neuron/health and updates a status icon in the Node-RED editor top bar


(function() {
    // Wait for Node-RED editor to load
    function addHealthIndicator() {
        if (document.getElementById('neuron-health-indicator')) return;
        // Find the Deploy button
        var deployBtn = document.querySelector('#red-ui-header-button-deploy');
        if (!deployBtn) return setTimeout(addHealthIndicator, 500);

        // Create indicator wrapper
        var wrapper = document.createElement('span');
        wrapper.id = 'neuron-health-indicator';
        wrapper.style.display = 'inline-block';
        wrapper.style.marginLeft = '10px';
        wrapper.style.verticalAlign = 'middle';
        wrapper.style.position = 'relative';
        wrapper.style.cursor = 'pointer';

        // Icon
        var icon = document.createElement('span');
        icon.innerHTML = '<svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#ccc" stroke="#888" stroke-width="2.5"/></svg>';
        icon.style.display = 'inline-block';
        icon.style.verticalAlign = 'middle';
        wrapper.appendChild(icon);

        // Dropdown
        var dropdown = document.createElement('div');
        dropdown.style.display = 'none';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '28px';
        dropdown.style.right = '0';
        dropdown.style.background = '#222';
        dropdown.style.color = '#fff';
        dropdown.style.border = '1px solid #444';
        dropdown.style.borderRadius = '6px';
        dropdown.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        dropdown.style.minWidth = '220px';
        dropdown.style.zIndex = '9999';
        dropdown.style.fontSize = '14px';
        dropdown.style.padding = '10px 0';
        dropdown.innerHTML = '<div style="padding:10px;text-align:center;color:#aaa;">Loading...</div>';
        wrapper.appendChild(dropdown);

        // Hover logic
        wrapper.addEventListener('mouseenter', function() {
            dropdown.style.display = 'block';
        });
        wrapper.addEventListener('mouseleave', function() {
            dropdown.style.display = 'none';
        });

        // Insert before Deploy button
        deployBtn.parentNode.insertBefore(wrapper, deployBtn);
        // Move to the left of the Deploy button (before it)
        if (deployBtn.previousSibling !== wrapper) {
            deployBtn.parentNode.insertBefore(wrapper, deployBtn);
        }

        // Save for later
        wrapper._icon = icon;
        wrapper._dropdown = dropdown;
    }

    function setIndicator(healthy, details) {
        var wrapper = document.getElementById('neuron-health-indicator');
        if (!wrapper) return;
        var icon = wrapper._icon;
        var dropdown = wrapper._dropdown;
        if (!icon || !dropdown) return;

        if (healthy) {
            icon.innerHTML = '<svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#4caf50" stroke="#888" stroke-width="2.5"/></svg>';
        } else {
            icon.innerHTML = '<svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#f44336" stroke="#888" stroke-width="2.5"/></svg>';
        }

        // Build dropdown content
        if (!details) {
            dropdown.innerHTML = '<div style="padding:10px;text-align:center;color:#aaa;">Loading...</div>';
            return;
        }
        var html = '';
        html += '<div style="padding:8px 16px;font-weight:bold;text-align:left;">Neuron Health Check</div>';
        html += '<hr style="margin:0 0 8px 0;border:0;border-top:1px solid #333;">';
        html += '<ul style="list-style:none;padding:0 16px 0 16px;margin:0;">';
        html += '<li><span style="color:' + (details.network.ok ? '#4caf50' : '#f44336') + ';font-weight:bold;">●</span> Network: ' + (details.network.ok ? 'OK' : ('Error: ' + (details.network.error||'fail'))) + '</li>';
        html += '<li><span style="color:' + (details.hedera.ok ? '#4caf50' : '#f44336') + ';font-weight:bold;">●</span> Hedera: ' + (details.hedera.ok ? 'OK' : ('Error: ' + (details.hedera.error||'fail'))) + '</li>';
        html += '<li><span style="color:' + (details.mirror.ok ? '#4caf50' : '#f44336') + ';font-weight:bold;">●</span> Mirror Node: ' + (details.mirror.ok ? 'OK' : ('Error: ' + (details.mirror.error||'fail'))) + '</li>';
        html += '</ul>';
        html += '<div style="padding:8px 16px 0 16px;font-size:12px;color:#aaa;text-align:right;">' + (details.timestamp ? details.timestamp.replace('T',' ').replace('Z','') : '') + '</div>';
        dropdown.innerHTML = html;
    }

    async function pollHealth() {
        try {
            const res = await fetch('/neuron/health');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            setIndicator(data.healthy, data);
        } catch (e) {
            setIndicator(false, null);
        }
        setTimeout(pollHealth, 5000);
    }

    addHealthIndicator();
    setTimeout(pollHealth, 2000);
    // In case the header loads late
    setTimeout(addHealthIndicator, 2000);
})();
